from fastapi import HTTPException

from app.core.security import hash_password, verify_password, create_access_token
from app.database import db
from app.models.user import build_user
from app.schemas.auth import SignupRequest, LoginRequest
from app.utils.helpers import new_id, now_utc, strip_password


async def register(body: SignupRequest) -> dict:
    if await db.users.find_one({"username": body.username}):
        raise HTTPException(status_code=409, detail="Username already taken. Please choose another.")

    if body.email and await db.users.find_one({"email": body.email}):
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    user_id = new_id()
    user_doc = build_user(
        uid=user_id,
        name=body.name,
        username=body.username,
        password_hash=hash_password(body.password),
        email=body.email,
    )
    await db.users.insert_one(user_doc)

    token = create_access_token(user_id, body.username)
    return {"access_token": token, "token_type": "bearer", "user": strip_password(user_doc)}


async def login(body: LoginRequest) -> dict:
    identifier = body.username.strip()
    query = {"$or": [{"username": identifier}, {"email": identifier}]}
    user = await db.users.find_one(query)

    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(
            status_code=401,
            detail="No account found with that username/email, or the password is incorrect.",
        )

    if user.get("is_banned"):
        raise HTTPException(status_code=403, detail="This account has been suspended.")

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"is_online": True, "last_seen_at": now_utc()}},
    )

    token = create_access_token(str(user["_id"]), user["username"])
    return {"access_token": token, "token_type": "bearer", "user": strip_password(user)}


async def logout(user_id: str) -> dict:
    await db.users.update_one(
        {"_id": user_id},
        {"$set": {"is_online": False, "last_seen_at": now_utc()}},
    )
    return {"message": "Logged out."}
