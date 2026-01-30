import { Module } from '@nestjs/common'
import { sequelizeProvider } from './database.providers'
@Module({
    imports: [],
    providers: [sequelizeProvider],
    exports: [sequelizeProvider],
})
export class DatabaseModule {}
