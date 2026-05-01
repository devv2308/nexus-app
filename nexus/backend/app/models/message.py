from datetime import datetime, timezone


def build_message(
    uid: str,
    conversation_id: str,
    sender_id: str,
    sender_username: str,
    text: str,
) -> dict:
    return {
        "_id": uid,
        "conversation_id": conversation_id,
        "sender_id": sender_id,
        "sender_username": sender_username,
        "text": text,
        "read_by": [sender_id],
        "created_at": datetime.now(timezone.utc),
    }


def build_conversation(uid: str, participant_ids: list[str]) -> dict:
    return {
        "_id": uid,
        "participants": participant_ids,
        "last_message": None,
        "last_message_at": None,
        "last_sender_id": None,
        "created_at": datetime.now(timezone.utc),
    }
