from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings


class _Database:
    client: AsyncIOMotorClient = None

    def __getattr__(self, name: str):
        if self.client is None:
            raise RuntimeError("Database not connected. Call db.connect() at startup.")
        return self.client[settings.MONGO_DB_NAME][name]

    async def connect(self) -> None:
        self.client = AsyncIOMotorClient(settings.MONGO_URI)
        await self._create_indexes()
        print(f"MongoDB connected -> {settings.MONGO_DB_NAME}")

    async def close(self) -> None:
        if self.client:
            self.client.close()

    async def _create_indexes(self) -> None:
        col = self.client[settings.MONGO_DB_NAME]
        await col.users.create_index("username", unique=True)
        await col.users.create_index("email", unique=True, sparse=True)
        await col.posts.create_index([("created_at", -1)])
        await col.posts.create_index("author_id")
        await col.conversations.create_index("participants")
        await col.messages.create_index("conversation_id")
        await col.messages.create_index([("created_at", 1)])
        await col.notifications.create_index("recipient_id")
        await col.notifications.create_index([("created_at", -1)])


db = _Database()
