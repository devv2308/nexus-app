from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# Passlib 1.7.x expects bcrypt.__about__.__version__, which bcrypt 4.x removed.
# Add a tiny shim so auth keeps working without noisy backend warnings.
if not hasattr(bcrypt, "__about__") and hasattr(bcrypt, "__version__"):
    class _BcryptAbout:
        __version__ = bcrypt.__version__

    bcrypt.__about__ = _BcryptAbout()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: str, username: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {
        "sub": user_id,
        "username": username,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None
