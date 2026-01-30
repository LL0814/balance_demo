import { Table, Column, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { BasicModel } from './basic.model'
import { User } from './user.model'

@Table({ tableName: 'user_balances' })
export class UserBalance extends BasicModel<UserBalance> {
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
    balance: number

    @Column({
        allowNull: false,
        type: DataType.INTEGER,
        defaultValue: 0,
    })
    version: number

    @BelongsTo(() => User)
    user: User
}
