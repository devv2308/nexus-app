from fastapi import APIRouter, Depends, Query, WebSocket, status

from app.controllers import chat_controller
from app.core.dependencies import get_current_user
from app.core.security import decode_token
from app.database import db
from app.schemas.chat import StartConversationRequest, SendMessageRequest

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.websocket("/ws/{conversation_id}")
async def websocket_chat(conversation_id: str, ws: WebSocket, token: str):
    """
    Real-time WebSocket endpoint for a specific conversation.
    The JWT is passed as a query param: ?token=<access_token>
    """
    payload = decode_token(token)
    if not payload:
        await ws.close(code=4001, reason="Unauthorized")
        return

    user_id = payload["sub"]
    user = await db.users.find_one({"_id": user_id})
    if not user:
        await ws.close(code=4001, reason="User not found")
        return

    await chat_controller.handle_ws(conversation_id, user_id, user["username"], ws)


@router.post("/conversations", status_code=status.HTTP_201_CREATED)
async def start_conversation(
    body: StartConversationRequest,
    current_user: dict = Depends(get_current_user),
):
    return await chat_controller.start_conversation(current_user["_id"], body)


@router.get("/conversations")
async def list_conversations(current_user: dict = Depends(get_current_user)):
    return await chat_controller.list_conversations(current_user["_id"])


@router.get("/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(50, le=100),
    current_user: dict = Depends(get_current_user),
):
    return await chat_controller.get_messages(
        conversation_id, current_user["_id"], page, limit
    )


@router.post("/conversations/{conversation_id}/messages", status_code=status.HTTP_201_CREATED)
async def send_message(
    conversation_id: str,
    body: SendMessageRequest,
    current_user: dict = Depends(get_current_user),
):
    return await chat_controller.send_message_http(
        conversation_id, current_user["_id"], current_user["username"], body
    )
