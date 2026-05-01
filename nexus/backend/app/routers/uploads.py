"""
app/routers/uploads.py
File / image upload endpoint.
Files are stored in UPLOAD_DIR and served as static files at /uploads/<filename>.
"""
from __future__ import annotations

import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.core.config import settings
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/uploads", tags=["Uploads"])

ALLOWED_TYPES = {
    "image/jpeg", "image/png", "image/gif",
    "image/webp", "image/svg+xml",
}
MAX_BYTES = settings.MAX_UPLOAD_MB * 1024 * 1024


@router.post("/image", status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Upload an image and return its public URL."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{file.content_type}'. Allowed: JPEG, PNG, GIF, WebP.",
        )

    # Read up to MAX_BYTES + 1 so we can detect oversized files
    data = await file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.MAX_UPLOAD_MB} MB.",
        )

    # Generate a unique filename preserving extension
    ext = Path(file.filename or "image").suffix.lower() or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    dest = Path(settings.UPLOAD_DIR) / filename
    dest.write_bytes(data)

    # Return URL relative to backend root — Vite proxies /uploads to the backend
    url = f"/uploads/{filename}"
    return {"url": url, "filename": filename, "size": len(data)}
