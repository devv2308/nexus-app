from fastapi import APIRouter, Depends, Query

from app.controllers import user_controller
from app.core.dependencies import get_current_user
from app.schemas.user import UpdateProfileRequest, UpdateSettingsRequest, BlockUserRequest

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/")
async def search_users(
    q: str = Query(""),
    limit: int = Query(30, le=100),
    current_user: dict = Depends(get_current_user),
):
    return await user_controller.search_users(q, limit)


@router.get("/me/settings")
async def get_settings(current_user: dict = Depends(get_current_user)):
    return await user_controller.get_settings(current_user)


@router.patch("/me/settings")
async def update_settings(
    body: UpdateSettingsRequest,
    current_user: dict = Depends(get_current_user),
):
    return await user_controller.update_settings(current_user["_id"], body)


@router.patch("/me/profile")
async def update_profile(
    body: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user),
):
    return await user_controller.update_profile(current_user["_id"], body)


@router.get("/me/blocked")
async def get_blocked(current_user: dict = Depends(get_current_user)):
    return await user_controller.get_blocked(current_user)


@router.post("/me/block")
async def toggle_block(
    body: BlockUserRequest,
    current_user: dict = Depends(get_current_user),
):
    return await user_controller.toggle_block(current_user["_id"], body)


@router.get("/{username}")
async def get_user(username: str, current_user: dict = Depends(get_current_user)):
    return await user_controller.get_user_by_username(username, current_user["_id"])


@router.post("/{user_id}/follow")
async def toggle_follow(user_id: str, current_user: dict = Depends(get_current_user)):
    return await user_controller.toggle_follow(current_user["_id"], user_id)
