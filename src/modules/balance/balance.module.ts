import { Module } from '@nestjs/common'
import { BalanceController } from './balance.controller'
import { BalanceService } from './balance.service'
import { DatabaseModule } from '@src/core/database/database.module'
import { RedisProvider } from '@src/core/redis/redis.provider'

@Module({
    imports: [DatabaseModule],
    controllers: [BalanceController],
    providers: [BalanceService, RedisProvider],
    exports: [BalanceService],
})
export class BalanceModule {}
