import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine
from app.models import Base
from app.routers import auth, doe_setups


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Only auto-create tables in development; production uses Alembic migrations
    if os.getenv("SUBUTAI_ENV", "development") == "development":
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(title="Subutai API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(doe_setups.router, prefix="/api/v1/doe-setups", tags=["doe-setups"])
