from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/subutai"
    jwt_secret: str  # Required — set SUBUTAI_JWT_SECRET env var
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    cors_origins: list[str] = ["http://localhost:5173"]

    model_config = {"env_prefix": "SUBUTAI_"}


settings = Settings()
