from fastapi import HTTPException

from app.database import db
from app.models.post import build_post
from app.models.notification import build_notification
from app.schemas.post import CreatePostRequest, UpdatePostRequest, CreateCommentRequest
from app.utils.helpers import new_id, now_utc, doc_to_dict, strip_password
from app.ws_managers import notif_manager


def _serialize(post: dict, me_id: str) -> dict:
    p = doc_to_dict(post)
    p["liked"] = me_id in post.get("likes", [])
    p["like_count"] = len(post.get("likes", []))
    p["comment_count"] = len(post.get("comments", []))
    return p


async def get_feed(me_id: str, following: list[str], page: int, limit: int) -> dict:
    visible = following + [me_id]
    skip = (page - 1) * limit
    posts = []
    async for p in db.posts.find({"author_id": {"$in": visible}}).sort("created_at", -1).skip(skip).limit(limit):
        posts.append(_serialize(p, me_id))
    return {"posts": posts, "page": page, "limit": limit}


async def list_posts(me_id: str, page: int, limit: int, tag: str) -> dict:
    query = {"tags": tag} if tag else {}
    skip = (page - 1) * limit
    posts = []
    async for p in db.posts.find(query).sort("created_at", -1).skip(skip).limit(limit):
        posts.append(_serialize(p, me_id))
    total = await db.posts.count_documents(query)
    return {"posts": posts, "total": total, "page": page}


async def get_post(post_id: str, me_id: str) -> dict:
    post = await db.posts.find_one({"_id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")
    return _serialize(post, me_id)


async def create_post(me_id: str, username: str, body: CreatePostRequest) -> dict:
    post_id = new_id()
    doc = build_post(post_id, me_id, username, body.content, body.tags, body.image)
    await db.posts.insert_one(doc)
    return _serialize(doc, me_id)


async def update_post(post_id: str, me_id: str, body: UpdatePostRequest) -> dict:
    post = await db.posts.find_one({"_id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")
    if post["author_id"] != me_id:
        raise HTTPException(status_code=403, detail="Not your post.")
    updates = body.model_dump(exclude_none=True)
    updates["updated_at"] = now_utc()
    await db.posts.update_one({"_id": post_id}, {"$set": updates})
    updated = await db.posts.find_one({"_id": post_id})
    return _serialize(updated, me_id)


async def delete_post(post_id: str, me_id: str) -> None:
    post = await db.posts.find_one({"_id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")
    if post["author_id"] != me_id:
        raise HTTPException(status_code=403, detail="Not your post.")
    await db.posts.delete_one({"_id": post_id})


async def toggle_like(post_id: str, me_id: str) -> dict:
    post = await db.posts.find_one({"_id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")
    already = me_id in post.get("likes", [])
    if already:
        await db.posts.update_one({"_id": post_id}, {"$pull": {"likes": me_id}})
        return {"liked": False, "like_count": len(post["likes"]) - 1}
    else:
        await db.posts.update_one({"_id": post_id}, {"$addToSet": {"likes": me_id}})
        if post["author_id"] != me_id:
            notif_doc = build_notification(
                new_id(), post["author_id"], me_id, "like", "liked your post", post_id
            )
            await db.notifications.insert_one(notif_doc)

            # Push real-time notification
            me = await db.users.find_one({"_id": me_id})
            await notif_manager.push(post["author_id"], {
                "event": "new_notification",
                **doc_to_dict(notif_doc),
                "from_user": strip_password(me) if me else {},
            })

        return {"liked": True, "like_count": len(post["likes"]) + 1}


async def add_comment(post_id: str, me_id: str, username: str, body: CreateCommentRequest) -> dict:
    post = await db.posts.find_one({"_id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")
    comment = {
        "id": new_id(),
        "author_id": me_id,
        "author_username": username,
        "text": body.text,
        "created_at": now_utc().isoformat(),
    }
    await db.posts.update_one({"_id": post_id}, {"$push": {"comments": comment}})
    if post["author_id"] != me_id:
        notif_doc = build_notification(
            new_id(), post["author_id"], me_id, "comment", "commented on your post", post_id
        )
        await db.notifications.insert_one(notif_doc)

        # Push real-time notification
        me = await db.users.find_one({"_id": me_id})
        await notif_manager.push(post["author_id"], {
            "event": "new_notification",
            **doc_to_dict(notif_doc),
            "from_user": strip_password(me) if me else {},
        })

    return comment


async def delete_comment(post_id: str, comment_id: str, me_id: str) -> None:
    await db.posts.update_one(
        {"_id": post_id},
        {"$pull": {"comments": {"id": comment_id, "author_id": me_id}}},
    )
