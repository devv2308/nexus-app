from typing import Optional
from pydantic import BaseModel, Field


class CreatePostRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    tags: list[str] = []
    image: Optional[str] = None   # base64 data URL


class UpdatePostRequest(BaseModel):
    content: Optional[str] = Field(None, min_length=1, max_length=2000)
    tags: Optional[list[str]] = None


class CreateCommentRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000)
