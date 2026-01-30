import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { BalanceModule } from './modules/balance/balance.module'
import { DatabaseModule } from './core/database/database.module'
import { ClsModule } from 'nestjs-cls'
import { ResponseFormatInterceptor } from './core/interceptors/response-format.interceptor'
import { APP_INTERCEPTOR } from '@nestjs/core'

@Module({
    imports: [
        ClsModule.forRoot({
            global: true, // 设置为全局模块
            middleware: {
                mount: true,
            },
        }),
        DatabaseModule,
        BalanceModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_INTERCEPTOR,
            useClass: ResponseFormatInterceptor,
        },
    ],
})
export class AppModule {}
