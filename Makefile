.PHONY: help up down migrate seed dev-backend dev-frontend dev-landing build-frontend build-landing install-frontend install-landing test lint

help:
	@echo "ScholarHUB monorepo commands"
	@echo "  make up              - Start backend + database + frontend (Docker)"
	@echo "  make down            - Stop all services"
	@echo "  make migrate         - Run Alembic migrations"
	@echo "  make seed            - Seed database with sample data"
	@echo "  make dev-backend     - Run backend dev server with local DB"
	@echo "  make dev-frontend    - Run frontend dev server"
	@echo "  make dev-landing     - Run landing page dev server"
	@echo "  make build-frontend  - Build frontend production bundle"
	@echo "  make build-landing   - Build GitHub Pages landing site"
	@echo "  make install-frontend - Install frontend dependencies"
	@echo "  make install-landing - Install landing page dependencies"
	@echo "  make test            - Run backend and frontend tests"
	@echo "  make lint            - Run backend and frontend linters"

up:
	docker compose -f infra/docker-compose.yml up --build -d

down:
	docker compose -f infra/docker-compose.yml down

migrate:
	cd backend && alembic upgrade head

seed:
	cd backend && python -m scripts.seed

dev-backend:
	cd backend && SCHOLARHUB_DATABASE_URL=postgresql+asyncpg://scholarhub:scholarhub@localhost:5432/scholarhub uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd frontend && npm run dev

dev-landing:
	cd landing && npm run dev

build-frontend:
	cd frontend && npm run build

build-landing:
	cd landing && npm run build

install-frontend:
	cd frontend && npm install

install-landing:
	cd landing && npm install

test:
	cd backend && pytest -q
	cd frontend && npm run test:run

lint:
	cd backend && ruff check app tests
	cd frontend && npm run lint
	cd landing && npm run lint
