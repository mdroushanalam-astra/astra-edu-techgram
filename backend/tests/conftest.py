"""Isolated database and signing key; never touch a developer's learner data."""
import os
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
_test_dir = tempfile.TemporaryDirectory(prefix="techgram-tests-", ignore_cleanup_errors=True)
os.environ["DATABASE_URL"] = os.environ.get("TEST_DATABASE_URL", "sqlite:///" + str(Path(_test_dir.name) / "tests.db"))
os.environ["JWT_SECRET_KEY"] = "test-only-key-with-at-least-thirty-two-bytes"
from app.db.session import init_db
init_db()
