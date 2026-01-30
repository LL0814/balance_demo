import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { SEQUELIZE } from '@src/core/constants'
import { REDIS_CLIENT } from '@src/core/redis/redis.provider'
import { User, UserBalance, BalanceTransaction } from '@src/models'
import Redis from 'ioredis'
// import { ClsService } from 'nestjs-cls'
import { ModelCtor, Sequelize } from 'sequelize-typescript'
import { ITransactionRequest } from './interface'

@Injectable()
export class BalanceService {
    private userModel: typeof User
    private userBalanceModel: typeof UserBalance
    private transactionModel: typeof BalanceTransaction
    constructor(
        @Inject(SEQUELIZE) private readonly sequelize: Sequelize,
        @Inject(REDIS_CLIENT)
        private readonly redisClient: Redis, // private readonly clsService: ClsService,
    ) {
        this.userModel = this.sequelize.model(User) as ModelCtor<User>
        this.userBalanceModel = this.sequelize.model(UserBalance) as ModelCtor<UserBalance>
        this.transactionModel = this.sequelize.model(
            BalanceTransaction,
        ) as ModelCtor<BalanceTransaction>
    }

    async getBalance(userId: string): Promise<number> {
        try {
            // 先从 Redis 缓存中获取余额
            const cacheKey = `user_balance:${userId}`
            const cachedBalance = await this.redisClient.get(cacheKey)
            if (cachedBalance !== null) {
                return parseFloat(cachedBalance)
            }
            // 如果缓存中没有，则从数据库中获取余额
            const userBalance = await this.userBalanceModel.findOne({
                where: { user_id: userId },
            })
            const balance = userBalance ? userBalance.balance : 0
            return balance
        } catch (error) {
            console.error('Error fetching balance:', error)
            throw new BadRequestException('获取余额失败')
        }
    }

    async issueTransactions(req: ITransactionRequest) {
        const maxRetries = 3
        let retryCount = 0
        let success = false

        // 获取所有涉及的用户 ID
        const userIds = [...new Set(req.transactions.map((tx) => tx.user_id))]

        while (retryCount < maxRetries && !success) {
            const lockKeys: string[] = []
            try {
                // 为所有涉及的用户获取 Redis 分布式锁
                for (const userId of userIds) {
                    const lockKey = `user_balance_lock:${userId}`
                    const lockAcquired = await this.redisClient.set(lockKey, '1', 'EX', 5, 'NX')

                    if (!lockAcquired) {
                        // 释放已获取的锁
                        for (const key of lockKeys) {
                            await this.redisClient.del(key)
                        }
                        throw new Error('获取锁失败')
                    }
                    lockKeys.push(lockKey)
                }

                // 获取所有用户的 Redis 版本号
                const userVersions = new Map<string, number>()
                for (const userId of userIds) {
                    const versionKey = `user_balance_version:${userId}`
                    const redisVersion = await this.redisClient.get(versionKey)
                    userVersions.set(userId, redisVersion ? parseInt(redisVersion) : 0) // 默认版本号为 0
                }

                // 在一个数据库事务中处理所有交易, 失败后数据库 commit 全部 rollback
                await this.sequelize.transaction(async (t) => {
                    // 用于跟踪每个用户的余额和版本变化
                    const userBalances = new Map<
                        string,
                        { balance: number; version: number; model: UserBalance | null }
                    >()

                    // 先获取并锁定所有涉及的用户余额
                    for (const userId of userIds) {
                        const userBalance = await this.userBalanceModel.findOne({
                            where: { user_id: userId },
                            lock: t.LOCK.UPDATE,
                            transaction: t,
                        })

                        const dbVersion = userBalance ? userBalance.version : 0
                        const expectedVersion = userVersions.get(userId) || 0

                        // 验证版本一致性
                        if (dbVersion < expectedVersion) {
                            // Redis版本大于DB版本：严重错误，数据不一致
                            throw new BadRequestException(
                                `版本异常: 用户 ${userId} DB version ${dbVersion} < Redis version ${expectedVersion}，数据不一致`,
                            )
                        } else if (dbVersion > expectedVersion) {
                            // Redis版本小于DB版本：缓存失效，从DB恢复
                            console.warn(
                                `Redis缓存失效, 从DB恢复版本: 用户 ${userId}, DB version: ${dbVersion}, Redis version: ${expectedVersion}`,
                            )
                            // 继续使用DB版本，后续会更新Redis
                        }

                        userBalances.set(userId, {
                            balance: userBalance ? userBalance.balance : 0, // 默认余额为 0
                            version: dbVersion, // 使用DB版本作为基准
                            model: userBalance,
                        })
                    }

                    // 处理所有交易
                    for (const tx of req.transactions) {
                        const { user_id, amount } = tx
                        const userBalanceData = userBalances.get(user_id)

                        const newBalance = userBalanceData.balance + amount

                        // 检查余额
                        if (req.checkBalance && newBalance < 0) {
                            throw new BadRequestException(`用户: user_id: ${user_id} 余额不足`)
                        }

                        // 创建交易记录
                        await this.transactionModel.create(
                            {
                                user_id,
                                amount,
                                ending_balance: newBalance,
                            },
                            { transaction: t },
                        )

                        // 更新本地余额记录
                        userBalanceData.balance = newBalance
                    }

                    // 批量更新所有用户余额
                    const redisUpdates = this.redisClient.multi()
                    for (const [userId, balanceData] of userBalances.entries()) {
                        const newVersion = balanceData.version + 1

                        if (balanceData.model) {
                            balanceData.model.balance = balanceData.balance
                            balanceData.model.version = newVersion
                            await balanceData.model.save({ transaction: t })
                        } else {
                            await this.userBalanceModel.create(
                                {
                                    user_id: userId,
                                    balance: balanceData.balance,
                                    version: newVersion,
                                },
                                { transaction: t },
                            )
                        }

                        // 准备 Redis 更新（不设置过期时间）
                        redisUpdates
                            .set(`user_balance:${userId}`, balanceData.balance.toString())
                            .set(`user_balance_version:${userId}`, newVersion.toString())
                    }

                    // 事务成功后批量更新 Redis
                    await redisUpdates.exec()
                })

                success = true
            } catch (error) {
                retryCount++
                if (retryCount >= maxRetries) {
                    console.error('交易批次失败:', error)
                    throw new BadRequestException(`交易失败: ${error.message || '未知错误'}`)
                }
                // 等待后重试
                await new Promise((resolve) => setTimeout(resolve, 100 * retryCount))
            } finally {
                // 释放所有锁
                for (const lockKey of lockKeys) {
                    await this.redisClient.del(lockKey)
                }
            }
        }
    }
}
