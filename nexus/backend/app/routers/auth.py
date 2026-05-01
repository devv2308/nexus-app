from fastapi import APIRouter, Depends, status

from app.controllers import auth_controller
from app.core.dependencies import get_current_user
from app.schemas.auth import SignupRequest, LoginRequest, TokenResponse
from app.utils.helpers import strip_password

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(body: SignupRequest):
    return await auth_controller.register(body)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    return await auth_controller.login(body)


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    return await auth_controller.logout(current_user["_id"])


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    return strip_password(current_user)
