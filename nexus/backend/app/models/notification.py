from datetime import datetime, timezone


def build_notification(
    uid: str,
    recipient_id: str,
    from_user_id: str,
    notif_type: str,   # "like" | "comment" | "follow" | "mention" | "message"
    text: str,
    post_id: str | None = None,
) -> dict:
    return {
        "_id": uid,
        "recipient_id": recipient_id,
        "from_user_id": from_user_id,
        "type": notif_type,
        "text": text,
        "post_id": post_id,
        "read": False,
        "created_at": datetime.now(timezone.utc),
    }
