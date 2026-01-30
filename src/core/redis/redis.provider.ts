// redis.provider.ts
import Redis from 'ioredis'

export const REDIS_CLIENT = 'REDIS_CLIENT'

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1'
const isLocal = !REDIS_HOST.includes('serverless.apse1.cache.amazonaws.com')

export const RedisProvider = {
    provide: REDIS_CLIENT,
    useFactory: () => {
        if (isLocal) {
            return new Redis({
                host: REDIS_HOST,
                port: 6379,
                db: 0,
            })
        } else {
            return new Redis({
                host: REDIS_HOST,
                port: 6379,
                db: 0,
                tls: {},
            })
        }
    },
}
