"""
System log service — centralized logging for the application.
"""

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.system_log_repo import SystemLogRepository
from app.schemas.system_log import SystemLogCreate
from app.utils.time_utils import utc_now


class SystemLogService:
    def __init__(self, db: AsyncSession):
        self.repo = SystemLogRepository(db)

    async def log(
        self,
        level: str,
        source: str,
        message: str,
        context: dict | None = None,
        sensor_id: UUID | None = None,
    ):
        """Create a new log entry."""
        now = utc_now()
        return await self.repo.create({
            "sensor_node_id": sensor_id,
            "level": level,
            "source": source,
            "message": message,
            "context": context,
            "logged_at": now,
            "created_at": now,
        })

    async def create_from_schema(self, data: SystemLogCreate):
        now = utc_now()
        return await self.repo.create({
            "sensor_node_id": data.sensor_node_id,
            "level": data.level,
            "source": data.source,
            "message": data.message,
            "context": data.context,
            "logged_at": now,
            "created_at": now,
        })

    async def get_logs(
        self,
        level: str | None = None,
        source: str | None = None,
        sensor_id: UUID | None = None,
        start_time=None,
        end_time=None,
        skip: int = 0,
        limit: int = 50,
    ):
        return await self.repo.get_filtered(
            level=level, source=source, sensor_id=sensor_id,
            start_time=start_time, end_time=end_time,
            skip=skip, limit=limit,
        )

    async def search_logs(self, query: str, skip: int = 0, limit: int = 50):
        return await self.repo.search(query, skip=skip, limit=limit)
