from datetime import datetime, timezone


def default_settings() -> dict:
    return {
        "theme": "dark",
        "language": "en",
        "chat_wallpaper": "none",
        "last_seen": "everyone",
        "online_status": "everyone",
        "read_receipts": True,
        "chat_history": "keep",
        "hide_status_from": [],
        "custom_lists": [
            {
                "id": "1",
                "name": "Close Friends",
                "emoji": "⭐",
                "color": "#c97a28",
                "members": [],
            }
        ],
    }


def build_user(
    uid: str,
    name: str,
    username: str,
    password_hash: str,
    email: str | None = None,
) -> dict:
    now = datetime.now(timezone.utc)
    initials = "".join(w[0].upper() for w in name.split()[:2])
    return {
        "_id": uid,
        "name": name,
        "username": username,
        "email": email,
        "password_hash": password_hash,
        "initials": initials,
        "bio": "",
        "avatar_url": None,
        "followers": [],
        "following": [],
        "is_banned": False,
        "settings": default_settings(),
        "blocked_users": [],
        "created_at": now,
        "last_seen_at": now,
        "is_online": True,
    }
