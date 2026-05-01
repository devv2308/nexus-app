from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.core.dependencies import get_current_user
from app.database import db
from app.utils.helpers import new_id, now_utc, doc_to_dict

router = APIRouter(prefix="/communities", tags=["Communities"])


class CreateCommunityRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=60)
    description: str = Field(..., max_length=300)
    icon: str = "🌐"


@router.get("/")
async def list_communities(
    q: str = Query(""),
    current_user: dict = Depends(get_current_user),
):
    query = {}
    if q:
        query = {"$or": [
            {"name": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
        ]}
    me_id = current_user["_id"]
    items = []
    async for c in db.communities.find(query).sort("member_count", -1):
        d = doc_to_dict(c)
        d["joined"] = me_id in c.get("members", [])
        items.append(d)
    return items


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_community(
    body: CreateCommunityRequest,
    current_user: dict = Depends(get_current_user),
):
    me_id = current_user["_id"]
    doc = {
        "_id": new_id(),
        "name": body.name,
        "description": body.description,
        "icon": body.icon,
        "owner_id": me_id,
        "members": [me_id],
        "member_count": 1,
        "created_at": now_utc(),
    }
    await db.communities.insert_one(doc)
    return doc_to_dict(doc)


@router.post("/{community_id}/join")
async def toggle_join(community_id: str, current_user: dict = Depends(get_current_user)):
    c = await db.communities.find_one({"_id": community_id})
    if not c:
        raise HTTPException(status_code=404, detail="Community not found.")
    me_id = current_user["_id"]
    already = me_id in c.get("members", [])
    if already:
        await db.communities.update_one(
            {"_id": community_id},
            {"$pull": {"members": me_id}, "$inc": {"member_count": -1}},
        )
        return {"joined": False}
    else:
        await db.communities.update_one(
            {"_id": community_id},
            {"$addToSet": {"members": me_id}, "$inc": {"member_count": 1}},
        )
        return {"joined": True}
