"""
app/ws_managers.py
Shared WebSocket connection managers for chat and real-time notifications.
Both are module-level singletons imported by routers and controllers.
"""
import json
from typing import Dict, Set

from fastapi import WebSocket


class ChatManager:
    """
    Manages WebSocket connections per conversation room.
    Also keeps a user → socket map so we can push to any user directly.
    """

    def __init__(self):
        self.rooms: Dict[str, Set[WebSocket]] = {}      # conversation_id → sockets
        self.user_sockets: Dict[str, WebSocket] = {}    # user_id → socket

    async def connect(self, conversation_id: str, user_id: str, ws: WebSocket):
        await ws.accept()
        self.rooms.setdefault(conversation_id, set()).add(ws)
        self.user_sockets[user_id] = ws

    def disconnect(self, conversation_id: str, user_id: str, ws: WebSocket):
        if conversation_id in self.rooms:
            self.rooms[conversation_id].discard(ws)
        self.user_sockets.pop(user_id, None)

    async def broadcast(self, conversation_id: str, payload: dict, exclude: WebSocket = None):
        """Send payload to everyone in a conversation room."""
        for ws in list(self.rooms.get(conversation_id, [])):
            if ws is not exclude:
                try:
                    await ws.send_text(json.dumps(payload, default=str))
                except Exception:
                    pass

    async def send_to_user(self, user_id: str, payload: dict):
        """Send payload directly to a user's chat socket (e.g. incoming DM)."""
        ws = self.user_sockets.get(user_id)
        if ws:
            try:
                await ws.send_text(json.dumps(payload, default=str))
            except Exception:
                pass


class NotificationManager:
    """
    Manages one persistent WebSocket per user for real-time notifications.
    Controllers call push() when creating a notification so the recipient
    sees it immediately without polling.
    """

    def __init__(self):
        self.connections: Dict[str, WebSocket] = {}     # user_id → socket

    async def connect(self, user_id: str, ws: WebSocket):
        await ws.accept()
        self.connections[user_id] = ws

    def disconnect(self, user_id: str):
        self.connections.pop(user_id, None)

    async def push(self, user_id: str, payload: dict):
        """Push a notification to a specific user if they're online."""
        ws = self.connections.get(user_id)
        if ws:
            try:
                await ws.send_text(json.dumps(payload, default=str))
            except Exception:
                self.connections.pop(user_id, None)

    def is_online(self, user_id: str) -> bool:
        return user_id in self.connections


# ── Module-level singletons ───────────────────────────────────────────────────
chat_manager = ChatManager()
notif_manager = NotificationManager()
