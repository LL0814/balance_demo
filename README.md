# Balance Demo

基于 NestJS + Sequelize + Redis 的高并发余额管理系统。

## 核心特性

- **分布式锁**：Redis 分布式锁防止并发冲突
- **乐观锁**：版本号控制保证数据一致性
- **批量事务**：单次事务处理多笔交易，全部成功或全部回滚
- **缓存策略**：Redis 缓存余额与版本号，不设置过期时间
- **自动恢复**：Redis 缓存失效时自动从数据库恢复

## 数据模型

### User
- `id`, `username`, `email`, `password`, `is_active`

### UserBalance
- `user_id`, `balance` (DECIMAL 36,18), `version` (乐观锁)

### BalanceTransaction
- `user_id`, `amount`, `ending_balance`

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
# REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
# 数据库连接配置

# 开发模式
npm run start:dev

# 生产模式
npm run start:prod
```

## API

### 查询余额
```
GET /balance/:user_id
```

### 发起交易
```
POST /balance/transactions
{
  "checkBalance": true,
  "transactions": [
    { "user_id": "xxx", "amount": 100 }
  ]
}
```

## 技术栈

- NestJS 9.x
- Sequelize + sequelize-typescript
- PostgreSQL
- Redis (ioredis)
- TypeScript

## License

MIT
