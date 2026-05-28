"""
DetectionImage repository — data-access layer for DetectionImage model.
"""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.detection_image import DetectionImage
from app.repositories.base import BaseRepository


class DetectionImageRepository(BaseRepository[DetectionImage]):
    def __init__(self, db: AsyncSession):
        super().__init__(DetectionImage, db)

    async def get_by_event_id(self, event_id: UUID) -> list[DetectionImage]:
        stmt = select(DetectionImage).where(DetectionImage.detection_event_id == event_id)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_storage_key(self, key: str) -> DetectionImage | None:
        stmt = select(DetectionImage).where(DetectionImage.storage_key == key)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
