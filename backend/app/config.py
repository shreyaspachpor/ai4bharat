"""Application settings loaded from environment variables."""

import os
import json
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """All env vars the backend needs."""

    # Firebase Admin SDK
    firebase_project_id: str = "test-project"
    firebase_client_email: str = "test@test.iam.gserviceaccount.com"
    firebase_private_key: str = "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7\n-----END PRIVATE KEY-----\n"

    # Gemini AI
    google_generative_ai_api_key: str = "placeholder_key"

    # CORS – always include known origins, overridable via CORS_ORIGINS env var
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "https://ai4bharat-five.vercel.app",
    ]

    # Admin email (prototype)
    admin_email: str = "admin123@skillfit.com"

    # Session cookie duration (seconds) – 1 week
    session_duration: int = 60 * 60 * 24 * 7

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


def _parse_cors_origins() -> list[str]:
    """Read CORS_ORIGINS env var — supports JSON array or comma-separated strings."""
    base = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "https://ai4bharat-five.vercel.app",
    ]
    raw = os.environ.get("CORS_ORIGINS", "")
    if not raw:
        return base
    raw = raw.strip()
    # Try JSON first
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            return list(set(base + [str(o) for o in parsed]))
    except (json.JSONDecodeError, ValueError):
        pass
    # Fall back to comma-separated
    extra = [o.strip().strip('"').strip("'") for o in raw.split(",") if o.strip()]
    return list(set(base + extra))


@lru_cache()
def get_settings() -> Settings:
    return Settings()


def get_cors_origins() -> list[str]:
    return _parse_cors_origins()
