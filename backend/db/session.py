from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from db.models import Base
from core.config import get_settings

cfg = get_settings()

# Sync engine (for migrations + simple queries)
engine = create_engine(cfg.database_url.replace("postgresql://", "postgresql+psycopg2://"))
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

async def create_tables():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
