import * as dotenv from 'dotenv'
import { IDatabaseConfig } from './interfaces/dbConfig.interface'

dotenv.config()

export const databaseConfig: IDatabaseConfig = {
    development: {
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'balance_dev',
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        dialect: 'postgres',
    },
}
