"""
Images router — upload, download, and metadata endpoints.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_role
from app.database import get_db
from app.models.user import User
from app.repositories.detection_image_repo import DetectionImageRepository
from app.schemas.detection_image import DetectionImageResponse
from app.services.image_storage_service import ImageStorageService
from app.utils.enums import UserRole

router = APIRouter(prefix="/images", tags=["Images"])


@router.get("/{image_id}", response_model=DetectionImageResponse)
async def get_image_metadata(
    image_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    repo = DetectionImageRepository(db)
    image = await repo.get_by_id(image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    return image


@router.get("/{image_id}/download")
async def download_image(
    image_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Stream image bytes from distributed MinIO."""
    repo = DetectionImageRepository(db)
    image = await repo.get_by_id(image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    try:
        storage = ImageStorageService()
        data = storage.get_object_bytes(image.storage_key)
        return Response(content=data, media_type=image.content_type)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Failed to retrieve image: {e}")


@router.get("/{image_id}/url")
async def get_presigned_url(
    image_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Get a presigned MinIO URL for direct access."""
    repo = DetectionImageRepository(db)
    image = await repo.get_by_id(image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    try:
        storage = ImageStorageService()
        url = storage.get_presigned_url(image.storage_key)
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Failed to generate URL: {e}")


@router.get("/by-event/{event_id}", response_model=list[DetectionImageResponse])
async def get_images_by_event(
    event_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    repo = DetectionImageRepository(db)
    return await repo.get_by_event_id(event_id)


@router.delete("/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_image(
    image_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
):
    """Delete image from MinIO + DB (admin only)."""
    repo = DetectionImageRepository(db)
    image = await repo.get_by_id(image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    try:
        storage = ImageStorageService()
        storage.delete_object(image.storage_key)
    except Exception:
        pass  # Continue DB deletion even if MinIO fails

    await repo.delete(image_id)
