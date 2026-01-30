import { Column, CreatedAt, DataType, ForeignKey, Model, UpdatedAt } from 'sequelize-typescript'
import { IBasicModel } from './interface/i.basic.model'
import { nanoid } from 'nanoid'
import { User } from './user.model'

export class BasicModel<T = any> extends Model<T> implements IBasicModel {
    @Column({
        primaryKey: true,
        unique: true,
        type: DataType.STRING, // 使用 STRING 类型存储 NanoID
        defaultValue: () => nanoid(16), // 使用 nanoid 生成 16 字符长度的 ID
    })
    id: string

    @CreatedAt
    created_date: Date

    @UpdatedAt
    last_modified_date: Date

    @ForeignKey(() => User)
    @Column({
        allowNull: true,
        type: DataType.STRING(16),
    })
    created_by: string

    @ForeignKey(() => User)
    @Column({
        allowNull: true,
        type: DataType.STRING(16),
    })
    last_modified_by: string
}
