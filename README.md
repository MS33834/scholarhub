# ScholarHUB

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

- React 18 + TypeScript + Vite 7
- Tailwind CSS 3 with a custom serif theme (ink-black / paper-white /
  moss / ochre palette)
- React Router 6 (HashRouter, GitHub-Pages-friendly)
- Zustand with `persist` middleware for settings & favorites
- lucide-react icons
- A tiny, dependency-free i18n layer (Context + typed dictionary + `useT()`)

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

Open <http://localhost:5173/scholarHUB/>.

This runs the frontend with local data only (no backend required).

### Full stack (frontend + backend)

**1. Start the backend:**

```bash
cd backend
pip install -e .
python -m app.db.init  # Initialize database
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**2. Start the frontend:**

```bash
# In another terminal
export VITE_API_URL=http://localhost:8000/api
npm run dev
```

Open <http://localhost:5173/scholarHUB/>.

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

**Option 1: Docker Compose**

```bash
# Clone the repository
git clone https://github.com/badhope/scholarHUB.git
cd scholarHUB

# Create .env file
cat > .env <<EOF
POSTGRES_USER=scholarhub
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=scholarhub
SCHOLARHUB_SECRET_KEY=your-jwt-secret-key
SCHOLARHUB_ADMIN_EMAIL=admin@example.com
SCHOLARHUB_ADMIN_PASSWORD=your-admin-password
EOF

# Start services
docker-compose up -d
```

**Option 2: Manual deployment**

1. **Backend:**
   ```bash
   cd backend
   pip install -e .
   export SCHOLARHUB_DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/scholarhub
   export SCHOLARHUB_SECRET_KEY=your-secret-key
   python -m app.db.init
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
   ```

2. **Frontend:**
   ```bash
   export VITE_API_URL=https://api.yourdomain.com/api
   npm run build
   # Deploy dist/ to your web server (nginx, Apache, etc.)
   ```

3. **Nginx configuration example:**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       # Frontend
       location / {
           root /var/www/scholarhub/dist;
           try_files $uri $uri/ /index.html;
       }

       # Backend API
       location /api {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

## Environment variables

### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:8000/api` |

### Backend

| Variable | Description | Default |
|----------|-------------|---------|
| `SCHOLARHUB_DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://scholarhub:scholarhub@localhost:5432/scholarhub` |
| `SCHOLARHUB_SECRET_KEY` | JWT secret key | `change-me-in-production` |
| `SCHOLARHUB_ADMIN_EMAIL` | Admin user email | `admin@scholarhub.local` |
| `SCHOLARHUB_ADMIN_PASSWORD` | Admin user password | `changeme` |
| `SCHOLARHUB_CORS_ORIGINS` | Allowed CORS origins | `["http://localhost:5173"]` |

## Data maintenance

### Without backend (Demo mode)

Resources are TypeScript files in `src/data/`. To add a new entry, edit
`src/data/resources.ts` following the existing shape; bilingual strings
live in `src/i18n/dict.ts`.

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

## License

This project is released under the MIT License. The resource metadata is
licensed under CC BY 4.0; the underlying resources remain under their
original licenses — see each detail page for attribution.
