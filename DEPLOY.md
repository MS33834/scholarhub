# ScholarHUB 服务器部署指南

本仓库在 GitHub Pages 上仅作为**静态展示**使用。真正的生产环境请在服务器上通过 Docker 部署。

## 架构概览

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Nginx     │──────│  FastAPI    │──────│  Postgres   │
│  (frontend) │ /api │  (backend)  │      │  (database) │
└─────────────┘      └─────────────┘      └─────────────┘
```

- **frontend**: 构建后的 React SPA，由 nginx 提供静态文件，并将 `/api` 反向代理到后端。
- **backend**: FastAPI 异步服务，启动时自动执行 Alembic 数据库迁移并创建管理员账号。
- **postgres**: PostgreSQL 数据库，数据通过 Docker volume 持久化。

## 环境变量

复制 `.env.example` 为 `.env` 并修改生产值：

```bash
cp .env.example .env
```

关键变量：

| 变量 | 说明 |
|------|------|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | 数据库账号/密码/库名 |
| `SCHOLARHUB_DATABASE_URL` | 后端数据库连接串 |
| `SCHOLARHUB_SECRET_KEY` | **必须修改**，用于 JWT 签名，至少 32 字符 |
| `SCHOLARHUB_ALLOWED_HOSTS` | 生产环境允许的 Host 头，如 `api.scholarhub.example` |
| `SCHOLARHUB_CORS_ORIGINS` | 允许的跨域来源 JSON 数组，如 `["https://scholarhub.example"]` |
| `SCHOLARHUB_ADMIN_EMAIL` / `SCHOLARHUB_ADMIN_PASSWORD` | 初始管理员账号 |
| `SCHOLARHUB_RATE_LIMIT_PER_MINUTE` | 每分钟每 IP 请求限制，默认 120 |
| `SCHOLARHUB_LOG_LEVEL` | 日志级别，默认 `INFO` |
| `SCHOLARHUB_JSON_LOGS` | 是否输出 JSON 结构化日志，生产建议 `true` |
| `UVICORN_WORKERS` | 后端工作进程数，默认 2 |

## 本地 Docker 构建验证

在提交或部署前，可以直接从仓库根目录构建生产镜像，确认 Dockerfile 语法与路径正确：

```bash
# 后端镜像（构建上下文为仓库根目录）
docker build -f infra/Dockerfile.backend -t scholarhub-backend:latest .

# 前端镜像
docker build -f infra/Dockerfile.frontend -t scholarhub-frontend:latest .
```

这两个命令仅验证构建是否成功，不会推送镜像。CI 工作流（`.github/workflows/ci.yml`）中也已加入相同的构建验证步骤。

## 生产部署最小步骤

```bash
# 1. 克隆代码
git clone <仓库地址>
cd scholarhub

# 2. 准备环境变量
cp .env.example .env
# 编辑 .env，至少修改以下值：
#   - POSTGRES_PASSWORD
#   - SCHOLARHUB_SECRET_KEY（至少 32 字符）
#   - SCHOLARHUB_ADMIN_PASSWORD
#   - SCHOLARHUB_ALLOWED_HOSTS（不能为 *）
#   - SCHOLARHUB_CORS_ORIGINS（改为实际域名）

# 3. 可选：先本地验证镜像可构建
docker build -f infra/Dockerfile.backend -t scholarhub-backend:latest .
docker build -f infra/Dockerfile.frontend -t scholarhub-frontend:latest .

# 4. 启动生产栈
docker compose -f infra/docker-compose.prod.yml up -d

# 5. 查看日志
docker compose -f infra/docker-compose.prod.yml logs -f
```

访问 `http://<服务器IP>` 即可。

## 更新部署

```bash
git pull
docker compose -f infra/docker-compose.prod.yml build
docker compose -f infra/docker-compose.prod.yml up -d
```

后端容器启动时会自动执行 Alembic `upgrade head`，无需手动改库。

## 本地开发

```bash
# 准备环境变量
cp .env.example .env

# 启动本地开发栈（包含 Postgres + backend + frontend）
docker compose -f infra/docker-compose.yml up --build -d

# 或者只启动数据库，前端用 Vite 开发服务器
docker compose -f infra/docker-compose.yml up -d db
# 然后在项目根目录
npm run dev
```

本地开发时前端默认调用 `http://localhost:8000/api`；在 Docker 内则通过 nginx 代理 `/api` 到后端。

## 安全建议

1. **不要在 `.env` 中使用默认密码**，尤其是 `SCHOLARHUB_SECRET_KEY` 和 `SCHOLARHUB_ADMIN_PASSWORD`。
2. 生产环境必须设置 `SCHOLARHUB_ALLOWED_HOSTS`，否则后端拒绝启动。
3. 使用 HTTPS 时，在反向代理（如 Nginx / Cloudflare）处终止 TLS，并确保 `X-Forwarded-Proto` 头正确传递。
4. 数据库端口在生产 `docker-compose.prod.yml` 中不暴露到宿主机，仅容器内部可访问。
5. 后端镜像以非 root 用户运行。

## 数据库迁移

迁移脚本已包含在镜像中。手动执行：

```bash
docker compose -f infra/docker-compose.prod.yml exec backend python -m alembic upgrade head
```

新增模型变更后，在本地生成迁移：

```bash
cd backend
alembic revision --autogenerate -m "describe change"
```

## 日志与可观测性

后端支持两种日志格式，通过环境变量切换：

- 开发（默认）：彩色文本，便于本地查看。
- 生产：设置 `SCHOLARHUB_JSON_LOGS=true`，输出 JSON 行日志，方便接入 Docker / CloudWatch / Loki 等日志聚合系统。

每个请求都会生成唯一的 `X-Request-ID`，后端日志与响应头均会携带，便于前后端联排查问题：

```bash
# 查看后端实时日志
docker compose -f infra/docker-compose.prod.yml logs -f backend

# 追踪某次请求
curl -H "X-Request-ID: debug-123" https://scholarhub.example/api/health
```

## 数据库备份与恢复

项目提供了基于 `pg_dump` 的备份脚本，位于 `backend/scripts/`。

### 手动备份

在已安装 `postgresql-client` 的机器上执行：

```bash
cd backend/scripts

export PGHOST=your-server-ip
export PGPORT=5432
export PGUSER=scholarhub
export PGPASSWORD=your-db-password
export PGDATABASE=scholarhub

./backup.sh /var/backups/scholarhub
# 输出：/var/backups/scholarhub/scholarhub_YYYYMMDD_HHMMSS.sql.gz
#       /var/backups/scholarhub/latest.sql.gz （稳定软链接）
```

### 自动定时备份

在宿主机添加 cron 任务，每天凌晨 3 点备份并清理 30 天前的旧文件：

```bash
0 3 * * * cd /opt/scholarhub/backend/scripts && \
  PGHOST=localhost PGUSER=scholarhub PGPASSWORD=xxx PGDATABASE=scholarhub \
  ./backup.sh /var/backups/scholarhub && \
  ./cleanup.sh /var/backups/scholarhub 30 >> /var/log/scholarhub-backup.log 2>&1
```

### 恢复数据库

**警告：恢复会删除并重建目标数据库，请谨慎操作。**

```bash
cd backend/scripts

export PGHOST=your-server-ip
export PGUSER=scholarhub
export PGPASSWORD=your-db-password
export PGDATABASE=scholarhub

./restore.sh /var/backups/scholarhub/latest.sql.gz
```

## 故障排查

| 现象 | 排查 |
|------|------|
| 前端白屏 / 404 | 检查 `VITE_BASE_PATH` 是否与实际路径一致 |
| API 请求失败 | 检查浏览器控制台 Network；确认 `SCHOLARHUB_CORS_ORIGINS` 包含当前域名 |
| 后端无法启动 | 查看容器日志；确认生产环境 `SCHOLARHUB_SECRET_KEY` 和 `SCHOLARHUB_ALLOWED_HOSTS` 已设置 |
| 数据库连接失败 | 确认 `SCHOLARHUB_DATABASE_URL` 主机名为 `postgres`（容器名） |
| 登录态频繁失效 | access token 默认 15 分钟，检查前端是否正常保存并使用 refresh token |
