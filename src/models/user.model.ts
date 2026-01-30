import { Table, Column, DataType } from 'sequelize-typescript'
import { BasicModel } from './basic.model'

@Table({
    tableName: 'users',
    timestamps: true, // 启用时间戳字段
    paranoid: false, // 禁用软删除功能
    freezeTableName: false, // 禁用表名复数化
})
export class User extends BasicModel<User> {
    @Column({
        allowNull: false,
        unique: true,
        type: DataType.STRING(64),
    })
    username: string

    @Column({
        allowNull: false,
        unique: true,
        type: DataType.STRING(128),
    })
    email: string

    @Column({
        allowNull: true,
        type: DataType.STRING,
    })
    password: string

    @Column({
        allowNull: false,
        type: DataType.BOOLEAN,
        defaultValue: true,
    })
    is_active: boolean
}
