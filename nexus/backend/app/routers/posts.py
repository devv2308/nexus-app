from fastapi import APIRouter, Depends, Query, status

from app.controllers import post_controller
from app.core.dependencies import get_current_user
from app.schemas.post import CreatePostRequest, UpdatePostRequest, CreateCommentRequest

router = APIRouter(prefix="/posts", tags=["Posts"])


@router.get("/feed")
async def feed(
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=50),
    current_user: dict = Depends(get_current_user),
):
    return await post_controller.get_feed(
        current_user["_id"], current_user.get("following", []), page, limit
    )


@router.get("/")
async def list_posts(
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=50),
    tag: str = "",
    current_user: dict = Depends(get_current_user),
):
    return await post_controller.list_posts(current_user["_id"], page, limit, tag)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_post(
    body: CreatePostRequest,
    current_user: dict = Depends(get_current_user),
):
    return await post_controller.create_post(current_user["_id"], current_user["username"], body)


@router.get("/{post_id}")
async def get_post(post_id: str, current_user: dict = Depends(get_current_user)):
    return await post_controller.get_post(post_id, current_user["_id"])


@router.patch("/{post_id}")
async def update_post(
    post_id: str,
    body: UpdatePostRequest,
    current_user: dict = Depends(get_current_user),
):
    return await post_controller.update_post(post_id, current_user["_id"], body)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(post_id: str, current_user: dict = Depends(get_current_user)):
    await post_controller.delete_post(post_id, current_user["_id"])


@router.post("/{post_id}/like")
async def toggle_like(post_id: str, current_user: dict = Depends(get_current_user)):
    return await post_controller.toggle_like(post_id, current_user["_id"])


@router.post("/{post_id}/comments", status_code=status.HTTP_201_CREATED)
async def add_comment(
    post_id: str,
    body: CreateCommentRequest,
    current_user: dict = Depends(get_current_user),
):
    return await post_controller.add_comment(
        post_id, current_user["_id"], current_user["username"], body
    )


@router.delete("/{post_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    post_id: str,
    comment_id: str,
    current_user: dict = Depends(get_current_user),
):
    await post_controller.delete_comment(post_id, comment_id, current_user["_id"])
