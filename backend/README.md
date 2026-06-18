# ScholarHUB API

Python + FastAPI + PostgreSQL 后端。

## 功能

- 资源管理（CRUD、搜索、统计）
- 用户认证（JWT，含 refresh token）
- 收藏管理
- 阅读历史
- Admin 权限控制

## 快速开始

```bash
cd backend
pip install -e ".[dev]"
```

复制 `.env.example` 到项目根目录的 `.env` 并修改数据库等配置，然后执行：

```bash
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

访问 API 文档：http://localhost:8000/docs

## 测试

```bash
pytest -q
```

## 主要环境变量

| 变量名 | 说明 |
|--------|------|
| `SCHOLARHUB_DATABASE_URL` | PostgreSQL 连接串 |
| `SCHOLARHUB_SECRET_KEY` | JWT 密钥（生产必须修改，至少 32 字符） |
| `SCHOLARHUB_ADMIN_EMAIL` / `SCHOLARHUB_ADMIN_PASSWORD` | 初始管理员账号 |
| `SCHOLARHUB_CORS_ORIGINS` | CORS 允许的源（JSON 数组字符串） |
| `SCHOLARHUB_ALLOWED_HOSTS` | 生产环境允许的 Host 头 |
| `SCHOLARHUB_RATE_LIMIT_PER_MINUTE` | 每分钟每 IP 限流 |
| `SCHOLARHUB_LOG_LEVEL` | 日志级别 |
| `SCHOLARHUB_JSON_LOGS` | 是否输出 JSON 结构化日志 |

## 部署

生产环境请使用项目根目录的 Docker Compose 配置，详见 [DEPLOY.md](../DEPLOY.md)。
