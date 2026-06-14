# ScholarHUB API

Python + FastAPI + PostgreSQL 后端服务。

## 功能

- 资源管理 API（CRUD）
- 用户认证（JWT）
- 收藏管理
- 阅读历史
- 管理后台（Admin 权限）

## 快速开始

### 1. 安装依赖

```bash
cd backend
pip install -e .
```

### 2. 配置数据库

创建 PostgreSQL 数据库：

```bash
createdb scholarhub
```

或修改 `.env` 文件：

```env
SCHOLARHUB_DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/scholarhub
SCHOLARHUB_SECRET_KEY=your-secret-key
SCHOLARHUB_ADMIN_EMAIL=admin@example.com
SCHOLARHUB_ADMIN_PASSWORD=your-password
```

### 3. 初始化数据库

```bash
# 创建表
alembic upgrade head

# 或手动运行初始化脚本
python -c "from app.db.init import init_db; import asyncio; asyncio.run(init_db())"
```

### 4. 启动服务

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

访问 API 文档：http://localhost:8000/docs

## API 端点

### 认证

- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `GET /api/auth/me` - 获取当前用户

### 资源

- `GET /api/resources/` - 获取资源列表（支持过滤）
- `GET /api/resources/{id}` - 获取资源详情
- `POST /api/resources/` - 创建资源（Admin）
- `PUT /api/resources/{id}` - 更新资源（Admin）
- `DELETE /api/resources/{id}` - 删除资源（Admin）

### 收藏

- `GET /api/favorites/` - 获取收藏列表
- `POST /api/favorites/{resource_id}` - 添加收藏
- `DELETE /api/favorites/{resource_id}` - 移除收藏

### 历史

- `GET /api/history/` - 获取阅读历史
- `POST /api/history/{resource_id}` - 添加到历史

## 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `SCHOLARHUB_DATABASE_URL` | `postgresql+asyncpg://scholarhub:scholarhub@localhost:5432/scholarhub` | 数据库连接 |
| `SCHOLARHUB_SECRET_KEY` | `change-me-in-production` | JWT 密钥 |
| `SCHOLARHUB_ADMIN_EMAIL` | `admin@scholarhub.local` | 管理员邮箱 |
| `SCHOLARHUB_ADMIN_PASSWORD` | `changeme` | 管理员密码 |
| `SCHOLARHUB_CORS_ORIGINS` | `["http://localhost:5173"]` | CORS 允许的源 |

## 部署

### Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY . .

RUN pip install -e .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 生产环境

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

建议使用 nginx 反向代理 + systemd 管理进程。
