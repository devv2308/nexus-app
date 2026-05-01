from fastapi import HTTPException

from app.database import db
from app.models.notification import build_notification
from app.schemas.user import UpdateProfileRequest, UpdateSettingsRequest, BlockUserRequest
from app.utils.helpers import now_utc, strip_password, new_id
from app.ws_managers import notif_manager
from app.utils.helpers import doc_to_dict


async def get_user_by_username(username: str, viewer_id: str) -> dict:
    user = await db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    result = strip_password(user)
    is_own = viewer_id == user["_id"]
    s = user.get("settings", {})

    if not is_own:
        if viewer_id in s.get("hide_status_from", []) or s.get("online_status") == "nobody":
            result.pop("is_online", None)
        if s.get("last_seen") == "nobody":
            result.pop("last_seen_at", None)

    result["follower_count"] = len(user.get("followers", []))
    result["following_count"] = len(user.get("following", []))
    result["is_following"] = viewer_id in user.get("followers", [])
    return result


async def search_users(q: str, limit: int) -> list[dict]:
    query = {}
    if q:
        query = {"$or": [
            {"username": {"$regex": q, "$options": "i"}},
            {"name": {"$regex": q, "$options": "i"}},
        ]}
    users = []
    async for u in db.users.find(query).limit(limit):
        users.append(strip_password(u))
    return users


async def update_profile(user_id: str, body: UpdateProfileRequest) -> dict:
    updates = body.model_dump(exclude_none=True)
    if not updates:
        u = await db.users.find_one({"_id": user_id})
        return strip_password(u)
    if "name" in updates:
        updates["initials"] = "".join(w[0].upper() for w in updates["name"].split()[:2])
    await db.users.update_one({"_id": user_id}, {"$set": updates})
    updated = await db.users.find_one({"_id": user_id})
    return strip_password(updated)


async def get_settings(user: dict) -> dict:
    return user.get("settings", {})


async def update_settings(user_id: str, body: UpdateSettingsRequest) -> dict:
    updates = body.model_dump(exclude_none=True)
    if not updates:
        u = await db.users.find_one({"_id": user_id})
        return u.get("settings", {})
    set_ops = {f"settings.{k}": v for k, v in updates.items()}
    await db.users.update_one({"_id": user_id}, {"$set": set_ops})
    updated = await db.users.find_one({"_id": user_id})
    return updated.get("settings", {})


async def toggle_follow(me_id: str, target_id: str) -> dict:
    if target_id == me_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself.")
    target = await db.users.find_one({"_id": target_id})
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    already = me_id in target.get("followers", [])
    if already:
        await db.users.update_one({"_id": target_id}, {"$pull": {"followers": me_id}})
        await db.users.update_one({"_id": me_id}, {"$pull": {"following": target_id}})
        return {"following": False}
    else:
        await db.users.update_one({"_id": target_id}, {"$addToSet": {"followers": me_id}})
        await db.users.update_one({"_id": me_id}, {"$addToSet": {"following": target_id}})

        # Build + persist notification
        notif_doc = build_notification(new_id(), target_id, me_id, "follow", "started following you")
        await db.notifications.insert_one(notif_doc)

        # Push real-time notification via WebSocket
        me = await db.users.find_one({"_id": me_id})
        await notif_manager.push(target_id, {
            "event": "new_notification",
            **doc_to_dict(notif_doc),
            "from_user": strip_password(me) if me else {},
        })

        return {"following": True}


async def toggle_block(me_id: str, body: BlockUserRequest) -> dict:
    target_id = body.target_user_id
    if target_id == me_id:
        raise HTTPException(status_code=400, detail="Cannot block yourself.")
    me = await db.users.find_one({"_id": me_id})
    blocked = me.get("blocked_users", [])
    if target_id in blocked:
        await db.users.update_one({"_id": me_id}, {"$pull": {"blocked_users": target_id}})
        return {"blocked": False}
    else:
        await db.users.update_one({"_id": me_id}, {"$addToSet": {"blocked_users": target_id}})
        return {"blocked": True}


async def get_blocked(user: dict) -> list[dict]:
    ids = user.get("blocked_users", [])
    users = []
    async for u in db.users.find({"_id": {"$in": ids}}):
        users.append(strip_password(u))
    return users
