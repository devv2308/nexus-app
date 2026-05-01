from typing import Optional
from pydantic import BaseModel, Field


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=60)
    bio: Optional[str] = Field(None, max_length=200)
    avatar_url: Optional[str] = None


class UpdateSettingsRequest(BaseModel):
    # Appearance
    theme: Optional[str] = None           # "dark" | "light"
    language: Optional[str] = None        # "en" | "hi" | "es" | "fr"
    chat_wallpaper: Optional[str] = None

    # Privacy
    last_seen: Optional[str] = None       # "everyone" | "contacts" | "nobody"
    online_status: Optional[str] = None
    read_receipts: Optional[bool] = None
    chat_history: Optional[str] = None

    # Advanced
    hide_status_from: Optional[list[str]] = None
    custom_lists: Optional[list[dict]] = None


class BlockUserRequest(BaseModel):
    target_user_id: str
