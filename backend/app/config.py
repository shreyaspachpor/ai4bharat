"""Application settings loaded from environment variables."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """All env vars the backend needs."""

    # Firebase Admin SDK
    firebase_project_id: str = "test-project"
    firebase_client_email: str = "test@test.iam.gserviceaccount.com"
    firebase_private_key: str = "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7\n-----END PRIVATE KEY-----\n"

    # Gemini AI
    google_generative_ai_api_key: str = "placeholder_key"

    # CORS – the Next.js frontend origin(s)
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ]

    # Admin email (prototype)
    admin_email: str = "admin123@skillfit.com"

    # Session cookie duration (seconds) – 1 week
    session_duration: int = 60 * 60 * 24 * 7

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
