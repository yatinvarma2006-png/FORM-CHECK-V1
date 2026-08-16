"""SQLAlchemy engine and session factory."""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import OperationalError

from config import DATABASE_URL

def _create_db_engine():
    try:
        engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=3600)
        # Test connection
        with engine.connect() as conn:
            pass
        print(f"✓ Connected to primary database: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")
        return engine
    except Exception as e:
        fallback_url = "sqlite:///./formcheck.db"
        print(f"⚠️ Primary database ({DATABASE_URL}) connection failed: {e}")
        print(f"🔄 Falling back to local SQLite database: {fallback_url}")
        return create_engine(fallback_url, connect_args={"check_same_thread": False})

engine = _create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
