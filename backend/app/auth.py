import os
import datetime
import hashlib
import hmac
from typing import Optional, Dict, Any
import jwt

def signing_key():
    key = os.environ.get("JWT_SECRET_KEY", "")
    if len(key.encode()) < 32:
        raise RuntimeError("JWT_SECRET_KEY must be configured with at least 32 bytes")
    return key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def hash_password(password: str) -> str:
    """
    PBKDF2-HMAC-SHA256 password hashing.
    Standard library implementation avoiding passlib/bcrypt C-extension version bugs.
    """
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 600_000)
    return f"600000${salt.hex()}${dk.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies password using constant-time comparison against stored PBKDF2 hash."""
    try:
        parts = hashed_password.split("$")
        if len(parts) == 2:
            iterations, (salt_hex, hash_hex) = 100_000, parts
        else:
            iterations, salt_hex, hash_hex = parts
            iterations = int(iterations)
        salt = bytes.fromhex(salt_hex)
        expected_dk = bytes.fromhex(hash_hex)
        actual_dk = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, iterations)
        return hmac.compare_digest(actual_dk, expected_dk)
    except Exception:
        return False

def create_access_token(data: Dict[str, Any], expires_delta: Optional[datetime.timedelta] = None) -> str:
    """Encodes a JWT payload with an expiration timestamp."""
    to_encode = data.copy()
    now = datetime.datetime.now(datetime.timezone.utc)
    expire = now + (expires_delta or datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "iat": now, "iss": "techgram", "aud": "techgram-api"})
    return jwt.encode(to_encode, signing_key(), algorithm=ALGORITHM)

def decode_access_token(token: str) -> Dict[str, Any]:
    """Decodes and validates JWT token."""
    return jwt.decode(token, signing_key(), algorithms=[ALGORITHM], audience="techgram-api", issuer="techgram", options={"require": ["exp", "iat", "sub", "iss", "aud"]})

DUMMY_PASSWORD_HASH = hash_password(os.urandom(32).hex())
