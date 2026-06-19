# ScholarHUB

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-blue?logo=github)](https://ms33834.github.io/scholarhub/)
[![CI](https://img.shields.io/badge/CI-passing-brightgreen?logo=githubactions)](https://github.com/MS33834/scholarhub/actions)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi)](https://fastapi.tiangolo.com/)

> An open shelf of papers, books, and datasets.
>
> A community-curated index of open academic resources, organised by discipline and topic.

## Overview

ScholarHUB aggregates freely-downloadable papers, textbooks, and public datasets
scattered across preprint servers, publishers, and open data platforms.

> **Note**: The GitHub Pages deployment is a **demo/showcase** only. For full functionality
> (user accounts, cloud-synced favorites, reading history), you need to deploy both the
> frontend and backend on your own server.

### Architecture

- **Frontend**: React SPA (this repository)
- **Backend**: Python FastAPI + PostgreSQL (see `backend/` directory)
- **Demo**: GitHub Pages shows the frontend with local data only

## Features

- **8 pages** — Home, Resources list, Resource detail, Discipline, Search,
  Favorites, Settings, About.
- **6 disciplines** and **4 resource types** (papers, books, datasets,
  tutorials), with seeded data you can browse end-to-end.
- **Bilingual UI** — English by default with a one-click toggle to Chinese.
- **Per-resource citations** in APA, MLA, GB/T 7714, and BibTeX with
  one-click clipboard copy.
- **User accounts** — register, login, cloud-synced favorites and reading history.
- **Local-first fallback** — works without backend using localStorage.
- **Three setting groups** — Theme (light / dark / auto), Font size
  (standard / large), Motion (full / reduced / off), plus the language
  toggle. All persist across sessions.
- **Accessibility** — keyboard focus rings, `aria-expanded` / `aria-pressed`
  on disclosure controls, `aria-label` on icon buttons, and `<html lang>`
  synced to the active language.

## Tech stack

### Frontend

- React 19 + TypeScript + Vite 8
- Tailwind CSS 4 with a custom serif theme
- React Router 7 (browser router for server deployments, hash router for GitHub Pages)
- Zustand with `persist` middleware for settings & favorites
- lucide-react icons
- A small i18n layer (Context + typed dictionary + `useT()`)

### Backend

- Python 3.11+
- FastAPI
- PostgreSQL + SQLAlchemy (async)
- JWT authentication
- See `backend/README.md` for details

## Local development

### Frontend only (demo mode)

```bash
npm install
npm run dev
```

Open <http://localhost:5173/>.

This runs the frontend with local data only (no backend required).

### Full stack (frontend + backend)

**1. Start the backend:**

```bash
cd backend
pip install -e ".[dev]"

# Ensure PostgreSQL is running and the database exists, then:
python -m app.db.init          # Run Alembic migrations + create admin user
python scripts/seed.py         # (Optional) insert sample resources

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**2. Start the frontend:**

```bash
# In another terminal
cp .env.example .env           # Or set VITE_* variables directly
npm run dev
```

Open <http://localhost:5173/>.

## Build

### Frontend

```bash
npm run build
```

Output goes to `dist/`.

### Backend

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Deployment

### GitHub Pages (Demo only)

Pushing to `main` triggers a GitHub Actions workflow (`.github/workflows/deploy.yml`)
that builds the frontend and publishes to GitHub Pages. This is a **demo/showcase** only.

### Production deployment (Full stack)

For full functionality (user accounts, cloud-synced favorites, reading history), deploy both frontend and backend to your own server.

See [DEPLOY.md](DEPLOY.md) for the complete Docker Compose setup, environment variables, backup scripts, and troubleshooting.

## Environment variables

### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:8000/api` |

### Backend

| Variable | Description | Default |
|----------|-------------|---------|
| `SCHOLARHUB_DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://scholarhub:scholarhub@localhost:5432/scholarhub` |
| `SCHOLARHUB_SECRET_KEY` | JWT secret key (min 32 chars) | `change-me-in-production-use-openssl-rand-hex-32` |
| `SCHOLARHUB_ADMIN_EMAIL` | Admin user email | `admin@scholarhub.local` |
| `SCHOLARHUB_ADMIN_PASSWORD` | Admin user password | `changeme` |
| `SCHOLARHUB_CORS_ORIGINS` | Allowed CORS origins | `["http://localhost:5173"]` |
| `SCHOLARHUB_ALLOWED_HOSTS` | Allowed Host headers in production | `localhost` |
| `SCHOLARHUB_RATE_LIMIT_PER_MINUTE` | Per-IP rate limit | `60` |
| `SCHOLARHUB_LOG_LEVEL` | Log level | `INFO` |
| `SCHOLARHUB_JSON_LOGS` | Output JSON logs | `false` |

## Data maintenance

### Without backend (Demo mode)

Resources are TypeScript files in `frontend/src/data/`. To add a new entry, edit
`frontend/src/data/resources.ts` following the existing shape; bilingual strings
live in `frontend/src/i18n/dict.ts`.

### With backend (Production mode)

Admin users can manage resources through the API:

```bash
# Login as admin
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}'

# Create resource
curl -X POST http://localhost:8000/api/resources \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id":"new-resource","title":"New Paper",...}'

# Visit http://localhost:8000/docs for full API documentation
```

## Documentation

- [Deployment guide](DEPLOY.md) — Docker Compose production setup, environment variables, backups
- [Backend README](backend/README.md) — FastAPI backend setup and API overview
- [Contributing](CONTRIBUTING.md) — How to add resources and develop locally
- [Code of Conduct](CODE_OF_CONDUCT.md) — Community guidelines
- [Security](SECURITY.md) — Reporting vulnerabilities

## License

This project is released under the MIT License. The resource metadata is
licensed under CC BY 4.0; the underlying resources remain under their
original licenses — see each detail page for attribution.
