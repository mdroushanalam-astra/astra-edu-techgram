"""Database-backed auth limits work across processes; identifiers are HMAC hashed."""
import hashlib
import hmac
import time
from sqlalchemy import text
from .auth import signing_key
from .db.models import AuthRateModel
from .db.repository import DatabaseRepository
from .db.session import SessionLocal

def check_auth_rate(ip, email):
    now = int(time.time())
    blocked = False
    with SessionLocal() as session:
        repo = DatabaseRepository(session)
        with repo.transaction():
            if session.bind.dialect.name == "postgresql":
                # Serialize bucket creation as well as updates across workers.
                session.execute(text("SELECT pg_advisory_xact_lock(71423001)"))
            for value, window, limit in (("ip:" + ip, 60, 60), ("email:" + email.strip().lower(), 600, 10)):
                key = hmac.new(signing_key().encode(), value.encode(), hashlib.sha256).hexdigest()
                bucket = session.get(AuthRateModel, key)
                if not bucket:
                    bucket = AuthRateModel(key=key, window_start=now, hits=0)
                    session.add(bucket)
                if now - bucket.window_start >= window:
                    bucket.window_start, bucket.hits = now, 0
                bucket.hits += 1
                blocked |= bucket.hits > limit
            # Discard expired buckets to avoid unbounded storage of identifiers.
            session.query(AuthRateModel).filter(AuthRateModel.window_start < now - 86400).delete()
    return blocked
