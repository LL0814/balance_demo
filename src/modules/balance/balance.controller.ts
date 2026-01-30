import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { BalanceService } from './balance.service'
import { ITransactionRequest } from './interface'

@Controller('balance')
export class BalanceController {
    constructor(private readonly balanceService: BalanceService) {}

    @Post('transactions')
    issueTransactions(@Body() req: ITransactionRequest) {
        return this.balanceService.issueTransactions(req)
    }

    @Get(':userId')
    getBalance(@Param('userId') userId: string) {
        return this.balanceService.getBalance(userId)
    }
}
