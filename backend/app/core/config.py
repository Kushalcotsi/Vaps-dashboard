from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Guided Selling VAPS Dashboard"
    
    # CORS Origins
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # Data Source Toggle
    USE_SNOWFLAKE: bool = False
    
    # Snowflake Settings
    SNOWFLAKE_USER: str = ""
    SNOWFLAKE_PASSWORD: str = ""
    SNOWFLAKE_ACCOUNT: str = ""
    SNOWFLAKE_WAREHOUSE: str = ""
    SNOWFLAKE_DATABASE: str = ""
    SNOWFLAKE_SCHEMA: str = ""
    SNOWFLAKE_ROLE: str = ""
    SNOWFLAKE_AUTHENTICATOR: str = "externalbrowser"
    
    # Paths
    DATA_PATH: str = "data"
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
