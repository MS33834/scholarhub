from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.favorites import router as favorites_router
from app.api.history import router as history_router
from app.api.resources import router as resources_router
from app.core.config import settings

app = FastAPI(title=settings.app_name, version="1.1.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router, prefix="/api")
app.include_router(resources_router, prefix="/api")
app.include_router(favorites_router, prefix="/api")
app.include_router(history_router, prefix="/api")


@app.get("/")
async def root():
    return {
        "name": "ScholarHUB API",
        "version": "1.1.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
