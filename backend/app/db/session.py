import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from .models import Base

DEFAULT_DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "techgram.db")
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    echo=False,
    pool_pre_ping=True,
    hide_parameters=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, expire_on_commit=False, bind=engine)

def init_db(custom_engine=None):
    """Initializes tables in database."""
    target_engine = custom_engine or engine
    Base.metadata.create_all(bind=target_engine)

def get_db_session():
    """Request dependency: session is always closed."""
    with SessionLocal() as session:
        yield session
