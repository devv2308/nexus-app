from datetime import datetime, timezone


def build_post(
    uid: str,
    author_id: str,
    author_username: str,
    content: str,
    tags: list[str],
    image: str | None = None,
) -> dict:
    now = datetime.now(timezone.utc)
    return {
        "_id": uid,
        "author_id": author_id,
        "author_username": author_username,
        "content": content,
        "tags": tags,
        "image": image,
        "likes": [],
        "comments": [],
        "created_at": now,
        "updated_at": now,
    }
