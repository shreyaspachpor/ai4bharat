"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import auth, interviews, feedback, aadhaar

settings = get_settings()

app = FastAPI(
    title="AI Mock Interview API",
    description="Backend API for the AI Mock Interview platform",
    version="1.0.0",
)

# CORS – allow the Next.js frontend to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(interviews.router)
app.include_router(feedback.router)
app.include_router(aadhaar.router)


@app.get("/")
async def root():
    return {"status": "ok", "message": "AI Mock Interview API is running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
