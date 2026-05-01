import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.database import db
from app.routers import auth, users, posts, chat, notifications, communities, ai, uploads


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure upload dir exists
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    await db.connect()
    yield
    await db.close()


app = FastAPI(
    title="Nexus API",
    version="2.0.0",
    description="Social platform REST + WebSocket + AI API",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS — supports localhost + any LAN IPs configured in .env ────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static file serving for uploads ──────────────────────────────────────────
upload_path = Path(settings.UPLOAD_DIR)
upload_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(upload_path)), name="uploads")

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,          prefix="/api")
app.include_router(users.router,         prefix="/api")
app.include_router(posts.router,         prefix="/api")
app.include_router(chat.router,          prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(communities.router,   prefix="/api")
app.include_router(ai.router,            prefix="/api")
app.include_router(uploads.router,       prefix="/api")


@app.get("/health", tags=["Health"])
async def health():
    return {
        "status": "ok",
        "version": "2.0.0",
        "ai_enabled": bool(settings.OPENAI_API_KEY),
    }
