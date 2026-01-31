"""
Application Configuration with Pydantic Settings
"""
from pydantic_settings import BaseSettings
from typing import List
from pathlib import Path


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables
    """

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Database
    DATABASE_URL: str = "sqlite:///./srt_manager.db"

    # CORS - CRITICAL: Specify exact domains in production!
    CORS_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS_ORIGINS string to list"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(',')]

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    # Server
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    RELOAD: bool = True

    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"

    # Logging
    LOG_LEVEL: str = "info"

    # Paths
    UPLOAD_FOLDER: Path = Path("static/uploads")
    STATS_FOLDER: Path = Path("static/stats")
    LOGS_FOLDER: Path = Path("static/logs")
    CONFIG_FILE: Path = Path("config.json")

    class Config:
        env_file = ".env"
        case_sensitive = True

    def validate_secret_key(self) -> None:
        """Validate SECRET_KEY strength"""
        if len(self.SECRET_KEY) < 32:
            raise ValueError(
                "SECRET_KEY must be at least 32 characters long for security"
            )
        if self.SECRET_KEY == "CHANGE_THIS_TO_A_RANDOM_32_CHAR_STRING":
            raise ValueError(
                "SECRET_KEY must be changed from default value! "
                "Generate one with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
            )


# Create global settings instance
settings = Settings()

# Validate on import
settings.validate_secret_key()
