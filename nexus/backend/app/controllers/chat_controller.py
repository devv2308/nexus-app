import json

from fastapi import WebSocket, WebSocketDisconnect

from app.database import db
from app.models.message import build_message, build_conversation
from app.models.notification import build_notification
from app.schemas.chat import StartConversationRequest, SendMessageRequest
from app.utils.helpers import new_id, now_utc, doc_to_dict, strip_password
from app.ws_managers import chat_manager, notif_manager


# ── WebSocket handler ─────────────────────────────────────────────────────────
async def handle_ws(conversation_id: str, user_id: str, username: str, ws: WebSocket):
    """
    Called by the router's WebSocket endpoint.
    Authenticates the participant, then handles the full message loop.
    """
    convo = await db.conversations.find_one({"_id": conversation_id})
    if not convo or user_id not in convo.get("participants", []):
        await ws.close(code=4003, reason="Not a participant")
        return

    await chat_manager.connect(conversation_id, user_id, ws)
    await db.users.update_one({"_id": user_id}, {"$set": {"is_online": True, "last_seen_at": now_utc()}})

    # Notify others in the room that this user joined
    await chat_manager.broadcast(
        conversation_id,
        {"event": "user_joined", "user_id": user_id, "username": username},
        exclude=ws,
    )

    try:
        while True:
            raw = await ws.receive_text()
            data = json.loads(raw)
            text = (data.get("text") or "").strip()
            if not text:
                # Could be a heartbeat / typing event
                event = data.get("event")
                if event == "typing":
                    await chat_manager.broadcast(
                        conversation_id,
                        {"event": "typing", "user_id": user_id, "username": username},
                        exclude=ws,
                    )
                continue

            # Persist message
            msg = build_message(new_id(), conversation_id, user_id, username, text)
            await db.messages.insert_one(msg)
            await db.conversations.update_one(
                {"_id": conversation_id},
                {"$set": {
                    "last_message": text,
                    "last_message_at": now_utc(),
                    "last_sender_id": user_id,
                }},
            )

            out = {**doc_to_dict(msg), "event": "new_message"}

            # Push once to the sender and once to everyone else.
            # Broadcasting to the sender as well would duplicate messages in the UI.
            await chat_manager.broadcast(conversation_id, out, exclude=ws)
            await ws.send_text(json.dumps(out, default=str))

            # Push a notification to the other participant if they aren't in the room
            other_id = next((p for p in convo["participants"] if p != user_id), None)
            if other_id and other_id not in [
                uid for uid, sock in chat_manager.user_sockets.items()
                if sock in chat_manager.rooms.get(conversation_id, set())
            ]:
                notif_doc = build_notification(
                    new_id(), other_id, user_id, "message",
                    f"sent you a message: {text[:60]}",
                )
                await db.notifications.insert_one(notif_doc)
                me = await db.users.find_one({"_id": user_id})
                await notif_manager.push(other_id, {
                    "event": "new_notification",
                    **doc_to_dict(notif_doc),
                    "from_user": strip_password(me) if me else {},
                })

    except WebSocketDisconnect:
        chat_manager.disconnect(conversation_id, user_id, ws)
        await db.users.update_one({"_id": user_id}, {"$set": {"is_online": False, "last_seen_at": now_utc()}})
        await chat_manager.broadcast(
            conversation_id,
            {"event": "user_left", "user_id": user_id, "username": username},
        )


# ── HTTP helpers ──────────────────────────────────────────────────────────────
async def start_conversation(me_id: str, body: StartConversationRequest) -> dict:
    from fastapi import HTTPException
    other_id = body.participant_id
    if me_id == other_id:
        raise HTTPException(status_code=400, detail="Cannot start a conversation with yourself.")
    if not await db.users.find_one({"_id": other_id}):
        raise HTTPException(status_code=404, detail="User not found.")

    existing = await db.conversations.find_one(
        {"participants": {"$all": [me_id, other_id], "$size": 2}}
    )
    if existing:
        return doc_to_dict(existing)

    convo = build_conversation(new_id(), [me_id, other_id])
    await db.conversations.insert_one(convo)
    return doc_to_dict(convo)


async def list_conversations(me_id: str) -> list[dict]:
    convos = []
    async for c in db.conversations.find({"participants": me_id}).sort("last_message_at", -1):
        item = doc_to_dict(c)
        other_id = next((p for p in c["participants"] if p != me_id), None)
        if other_id:
            other = await db.users.find_one({"_id": other_id})
            if other:
                item["other_user"] = strip_password(other)
        item["unread_count"] = await db.messages.count_documents({
            "conversation_id": c["_id"],
            "read_by": {"$nin": [me_id]},
            "sender_id": {"$ne": me_id},
        })
        convos.append(item)
    return convos


async def get_messages(conversation_id: str, me_id: str, page: int, limit: int) -> list[dict]:
    from fastapi import HTTPException
    convo = await db.conversations.find_one({"_id": conversation_id})
    if not convo or me_id not in convo.get("participants", []):
        raise HTTPException(status_code=403, detail="Access denied.")

    skip = (page - 1) * limit
    msgs = []
    async for m in (
        db.messages.find({"conversation_id": conversation_id})
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    ):
        msgs.append(doc_to_dict(m))

    await db.messages.update_many(
        {"conversation_id": conversation_id, "sender_id": {"$ne": me_id}},
        {"$addToSet": {"read_by": me_id}},
    )
    return list(reversed(msgs))


async def send_message_http(
    conversation_id: str, me_id: str, username: str, body: SendMessageRequest
) -> dict:
    from fastapi import HTTPException
    convo = await db.conversations.find_one({"_id": conversation_id})
    if not convo or me_id not in convo.get("participants", []):
        raise HTTPException(status_code=403, detail="Access denied.")

    msg = build_message(new_id(), conversation_id, me_id, username, body.text)
    await db.messages.insert_one(msg)
    await db.conversations.update_one(
        {"_id": conversation_id},
        {"$set": {
            "last_message": body.text,
            "last_message_at": now_utc(),
            "last_sender_id": me_id,
        }},
    )
    out = doc_to_dict(msg)

    # Push to the other participant via their chat socket
    other_id = next((p for p in convo["participants"] if p != me_id), None)
    if other_id:
        await chat_manager.send_to_user(other_id, {**out, "event": "new_message"})

    return out
