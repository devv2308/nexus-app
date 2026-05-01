from __future__ import annotations
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── MongoDB ────────────────────────────────────────────────────────────────
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "nexus"

    # ── JWT ────────────────────────────────────────────────────────────────────
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 10080  # 7 days

    # ── Server ────────────────────────────────────────────────────────────────
    BACKEND_PORT: int = 8000
    # Comma-separated allowed origins — add your LAN IP for mobile
    FRONTEND_ORIGINS: str = "http://localhost:3000"
    DEBUG: bool = True

    # ── AI ────────────────────────────────────────────────────────────────────
    OPENAI_API_KEY: str = ""
    AI_MODEL: str = "gpt-4o-mini"
    AI_MAX_TOKENS: int = 1024
    AI_SYSTEM_PROMPT: str = (
        "You are Nexus AI — a helpful, friendly assistant built into the Nexus "
        "social platform. You help users with writing, ideas, questions, and creative tasks. "
        "Be concise, warm, and genuinely useful."
    )

    # ── Uploads ───────────────────────────────────────────────────────────────
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_MB: int = 10

    @property
    def allowed_origins(self) -> List[str]:
        return [o.strip() for o in self.FRONTEND_ORIGINS.split(",") if o.strip()]


settings = Settings()
