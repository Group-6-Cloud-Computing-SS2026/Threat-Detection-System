"""Configuration management for the backend application."""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings from environment variables."""
    
    # Application
    app_name: str = "Threat Detection System"
    app_env: str = "development"
    debug: bool = True
    version: str = "1.0.0"
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    
    # Storage (Task 7: Distributed filesystem on k3s)
    storage_enabled: bool = True
    storage_path: str = "/data/threats"
    
    # Threat Detection Settings
    threat_sensitivity: float = 0.7
    critical_threshold: float = 0.95
    high_threshold: float = 0.85
    medium_threshold: float = 0.70
    
    # Telegram Notifications (Task 9)
    telegram_enabled: bool = False
    telegram_bot_token: Optional[str] = None
    telegram_chat_id: Optional[str] = None
    
    # Monitoring
    enable_metrics: bool = True
    metrics_port: int = 8001
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
