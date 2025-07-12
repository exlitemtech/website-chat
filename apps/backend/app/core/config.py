from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://user:password@localhost/website_chat"
    
    # Redis
    redis_url: str = "redis://localhost:6379"
    
    # JWT
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    # CORS
    backend_cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001"]
    
    # Environment
    environment: str = "development"
    debug: bool = True
    
    # File uploads
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    upload_path: str = "./uploads"
    
    class Config:
        env_file = ".env"

settings = Settings()