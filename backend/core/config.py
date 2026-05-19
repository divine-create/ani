from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Google
    google_client_id: str = ""
    google_client_secret: str = ""
    gmb_account_id: str = ""
    gmb_location_id: str = ""
    business_name: str = "My Business"
    gcp_project: str = ""

    # Twilio / WhatsApp
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_whatsapp_number: str = "+14155238886"

    # Notion
    notion_api_key: str = ""
    notion_tasks_db_id: str = ""
    notion_client_id: str = ""
    notion_client_secret: str = ""

    # Slack
    slack_bot_token: str = ""
    slack_channel_id: str = ""
    slack_client_id: str = ""
    slack_client_secret: str = ""

    # Calendly
    calendly_api_key: str = ""
    calendly_client_id: str = ""
    calendly_client_secret: str = ""

    # Proxycurl
    proxycurl_api_key: str = ""

    # DeepSeek
    deepseek_api_key: str = ""

    # Gemini
    gemini_api_key: str = ""

    # Database
    database_url: str = "postgresql://ani:anipass@postgres:5432/ani"

    # App
    dashboard_url: str = "http://localhost:3000"
    environment: str = "development"

    # JWT
    jwt_secret: str = "ani-dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 168  # 7 days

    class Config:
        env_file = ".env"
        extra = "ignore"

@lru_cache
def get_settings() -> Settings:
    return Settings()
