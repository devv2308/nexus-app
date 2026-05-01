"""
scripts/seed.py
Seeds the database with starter communities only.
No demo users — all users must register through the app.

Run from the backend/ folder:
    python scripts/seed.py
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import db
from app.utils.helpers import new_id, now_utc


COMMUNITIES = [
    {"name": "Dev Circle",    "description": "Building the next generation of software", "icon": "💻"},
    {"name": "Design Minds",  "description": "Where designers think out loud",           "icon": "🎨"},
    {"name": "AI & ML Hub",   "description": "Pushing the frontier of AI",               "icon": "🤖"},
    {"name": "Startup Pulse", "description": "Founders, builders, and dreamers",         "icon": "🚀"},
    {"name": "Photography",   "description": "Capture the world through your lens",      "icon": "📷"},
    {"name": "Book Club",     "description": "Readers who love to discuss",              "icon": "📚"},
]


async def seed():
    await db.connect()

    existing_names = [c["name"] for c in COMMUNITIES]
    await db.communities.delete_many({"name": {"$in": existing_names}})

    for c in COMMUNITIES:
        doc = {
            "_id": new_id(),
            "name": c["name"],
            "description": c["description"],
            "icon": c["icon"],
            "owner_id": "system",
            "members": [],
            "member_count": 0,
            "created_at": now_utc(),
        }
        await db.communities.insert_one(doc)
        print(f"  ✅  Community: {c['icon']}  {c['name']}")

    print("\n🎉  Seed complete! Register a new account at http://localhost:3000")
    await db.close()


if __name__ == "__main__":
    asyncio.run(seed())
