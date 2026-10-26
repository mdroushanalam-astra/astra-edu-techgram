from pathlib import Path
from alembic import command
from alembic.config import Config
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from sqlalchemy import create_engine, inspect
from app.db.models import Base

def test_frozen_migration_matches_schema_and_is_repeatable(tmp_path, monkeypatch):
    url = "sqlite:///" + str(tmp_path / "migration.db")
    monkeypatch.setenv("DATABASE_URL", url)
    config = Config(str(Path(__file__).resolve().parents[1] / "alembic.ini"))
    command.upgrade(config, "head")
    command.upgrade(config, "head")
    engine = create_engine(url)
    with engine.connect() as connection:
        assert "learning_projections" in inspect(connection).get_table_names()
        assert compare_metadata(MigrationContext.configure(connection), Base.metadata) == []
    engine.dispose()
