import { Sequelize } from 'sequelize-typescript'
import { databaseConfig } from './database.config'
import { DATABASE, SEQUELIZE, ADMIN_ID } from '@src/core/constants'
import * as entities from '@src/models'
import { Logger } from '@nestjs/common'
import { ClsService } from 'nestjs-cls'

const logger = new Logger('DatabaseProviders')

logger.debug('Current NODE_ENV:', process.env.NODE_ENV)

let config
switch (process.env.NODE_ENV) {
    case DATABASE.DEVELOPMENT:
        config = databaseConfig.development
        break
    case DATABASE.TEST:
        config = databaseConfig.test
        break
    case DATABASE.PRODUCTION:
        config = databaseConfig.production
        break
    default:
        config = databaseConfig.development
}
config.logging = false // 关闭日志输出
logger.debug(config)

logger.log(ADMIN_ID)

export const sequelizeProvider = {
    provide: SEQUELIZE,
    useFactory: async (clsService: ClsService) => {
        // === 新增：连接池参数（避免旧 token 残留）===
        config.pool = {
            max: 10,
            min: 0,
            idle: 5000,
            evict: 5000,
            acquire: 20000,
        }

        const sequelize = new Sequelize(config)
        const modelClasses = Object.values(entities)
        sequelize.addModels(modelClasses)

        // 注册全局 beforeCreate 钩子
        sequelize.addHook('beforeCreate', (instance: any) => {
            logger.log('================ global before Create ====================')
            const userId = clsService.get('payload')?.sub
            const currentUserId = userId || ADMIN_ID
            logger.log(`================ ${currentUserId} ====================`)
            instance.created_by = currentUserId
            instance.last_modified_by = currentUserId
        })

        // 注册全局 beforeUpdate 钩子
        sequelize.addHook('beforeUpdate', (instance: any) => {
            logger.log('================ global before Update ====================')
            const userId = clsService.get('payload')?.sub
            const currentUserId = userId || ADMIN_ID
            logger.log(`================ ${currentUserId} ====================`)
            instance.last_modified_by = currentUserId
        })

        // 添加全局的 beforeBulkCreate 钩子
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        sequelize.addHook('beforeBulkCreate', (instances, options) => {
            logger.log('Global beforeBulkCreate hook triggered')
            const userId = clsService.get('payload')?.sub
            const currentUserId = userId || ADMIN_ID
            logger.log(`================ ${currentUserId} ====================`)
            instances.forEach((instance) => {
                // 例如，为每个实例添加一个默认值
                instance.set('created_by', currentUserId)
                instance.set('last_modified_by', currentUserId)
            })
        })

        // 添加全局的 beforeBulkUpdate 钩子
        sequelize.addHook('beforeBulkUpdate', (options: any) => {
            logger.log('Global beforeBulkUpdate hook triggered')
            const userId = clsService.get('payload')?.sub
            const currentUserId = userId || ADMIN_ID
            logger.log(`================ ${currentUserId} ====================`)
            // 为每一条数据设置 lastModifiedById
            if (options?.attributes) {
                // 确保在批量更新时，附加 last_modified_by
                options.attributes.last_modified_by = currentUserId
                if (!options.fields.includes('last_modified_by')) {
                    options.fields.push('last_modified_by') // 确保字段被 Sequelize 处理
                }
            }
        })
        // 同步所有模型到数据库
        // sequelize
        //     .sync({ alter: true, logging: true })
        //     .then(() => {
        //         logger.debug('All models have been synchronized to the database.')
        //     })
        //     .catch((error) => {
        //         logger.error('Unable to synchronize models:')
        //         logger.log(error)
        //     })

        // 重试连接数据库（最多5次，每次间隔3秒）
        const MAX_RETRIES = 5
        const RETRY_DELAY_MS = 3000

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                await sequelize.authenticate()
                logger.debug('Database connection has been established successfully.')
                break
            } catch (error) {
                logger.error(`Attempt ${attempt} - Unable to connect to the database:`, error)
                if (attempt < MAX_RETRIES) {
                    logger.log(`Retrying in ${RETRY_DELAY_MS / 1000} seconds...`)
                    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
                } else {
                    logger.error(
                        'All retry attempts failed. Could not connect to the database. ' +
                            JSON.stringify(error),
                    )
                }
            }
        }

        return sequelize
    },
    inject: [ClsService],
}
