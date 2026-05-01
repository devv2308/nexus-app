from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect

from app.core.dependencies import get_current_user
from app.core.security import decode_token
from app.database import db
from app.utils.helpers import doc_to_dict
from app.ws_managers import notif_manager

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.websocket("/ws")
async def notification_ws(ws: WebSocket, token: str):
    """
    Persistent WebSocket that pushes real-time notifications to the user.
    Connect once after login; keep alive until the user closes the tab.
    The JWT is passed as: ws://host/api/notifications/ws?token=<token>
    """
    payload = decode_token(token)
    if not payload:
        await ws.close(code=4001, reason="Unauthorized")
        return

    user_id = payload["sub"]
    await notif_manager.connect(user_id, ws)

    try:
        while True:
            # Client can send a heartbeat ping; we just acknowledge
            data = await ws.receive_text()
            if data == "ping":
                await ws.send_text("pong")
    except WebSocketDisconnect:
        notif_manager.disconnect(user_id)


@router.get("/")
async def list_notifications(
    limit: int = Query(50, le=100),
    current_user: dict = Depends(get_current_user),
):
    notifs = []
    async for n in (
        db.notifications.find({"recipient_id": current_user["_id"]})
        .sort("created_at", -1)
        .limit(limit)
    ):
        notifs.append(doc_to_dict(n))
    return notifs


@router.get("/unread-count")
async def unread_count(current_user: dict = Depends(get_current_user)):
    count = await db.notifications.count_documents(
        {"recipient_id": current_user["_id"], "read": False}
    )
    return {"count": count}


@router.post("/read-all")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    await db.notifications.update_many(
        {"recipient_id": current_user["_id"], "read": False},
        {"$set": {"read": True}},
    )
    return {"message": "All marked as read."}


@router.post("/{notif_id}/read")
async def mark_one_read(notif_id: str, current_user: dict = Depends(get_current_user)):
    await db.notifications.update_one(
        {"_id": notif_id, "recipient_id": current_user["_id"]},
        {"$set": {"read": True}},
    )
    return {"message": "Marked as read."}
