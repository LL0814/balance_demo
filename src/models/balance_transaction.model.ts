import { Table, Column, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { BasicModel } from './basic.model'
import { User } from './user.model'

@Table({ tableName: 'balance_transactions' })
export class BalanceTransaction extends BasicModel<BalanceTransaction> {
    @ForeignKey(() => User)
    @Column({
        allowNull: false,
        type: DataType.STRING(16),
    })
    user_id: string

    @Column({
        allowNull: false,
        type: DataType.DECIMAL(36, 18),
        defaultValue: 0,
    })
    amount: number

    @Column({
        allowNull: false,
        type: DataType.DECIMAL(36, 18),
        defaultValue: 0,
    })
    ending_balance: number

    @BelongsTo(() => User)
    user: User
}
