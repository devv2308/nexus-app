import re
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=60)
    username: str = Field(..., min_length=3, max_length=30)
    email: Optional[EmailStr] = None
    password: str = Field(..., min_length=6, max_length=100)

    @field_validator("username")
    @classmethod
    def username_valid(cls, v: str) -> str:
        if not re.match(r"^[a-z0-9_]+$", v):
            raise ValueError("Username may only contain lowercase letters, numbers, and underscores.")
        return v


class LoginRequest(BaseModel):
    username: str   # accepts username OR email
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
