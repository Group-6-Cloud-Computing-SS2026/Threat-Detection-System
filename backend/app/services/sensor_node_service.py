"""
SensorNode service — business logic for sensor node management.
"""

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.sensor_node_repo import SensorNodeRepository
from app.schemas.sensor_node import SensorNodeCreate, SensorNodeUpdate
from app.utils.enums import NodeStatus
from app.utils.exceptions import ConflictException, NotFoundException
from app.utils.time_utils import utc_now


class SensorNodeService:
    def __init__(self, db: AsyncSession):
        self.repo = SensorNodeRepository(db)

    async def register_node(self, data: SensorNodeCreate):
        """Register a new sensor node."""
        existing = await self.repo.get_by_hostname(data.hostname)
        if existing:
            raise ConflictException(f"Node with hostname '{data.hostname}' already registered")

        return await self.repo.create({
            **data.model_dump(),
            "status": NodeStatus.OFFLINE,
            "registered_at": utc_now(),
            "created_at": utc_now(),
            "updated_at": utc_now(),
        })

    async def update_node(self, node_id: UUID, data: SensorNodeUpdate):
        """Update sensor node metadata."""
        update_data = data.model_dump(exclude_unset=True)
        if not update_data:
            node = await self.repo.get_by_id(node_id)
            if not node:
                raise NotFoundException("SensorNode", node_id)
            return node

        update_data["updated_at"] = utc_now()
        node = await self.repo.update(node_id, update_data)
        if not node:
            raise NotFoundException("SensorNode", node_id)
        return node

    async def deregister_node(self, node_id: UUID) -> None:
        """Delete a sensor node."""
        deleted = await self.repo.delete(node_id)
        if not deleted:
            raise NotFoundException("SensorNode", node_id)

    async def get_node(self, node_id: UUID):
        """Get a single node by ID."""
        node = await self.repo.get_by_id(node_id)
        if not node:
            raise NotFoundException("SensorNode", node_id)
        return node

    async def get_all_nodes(self, skip: int = 0, limit: int = 50, status: str | None = None):
        """List nodes with optional status filter."""
        filters = {}
        if status:
            filters["status"] = status
        items = await self.repo.get_all(skip=skip, limit=limit, filters=filters)
        total = await self.repo.count(filters=filters)
        return items, total

    async def get_all_with_status(self):
        """Get all nodes with current status for frontend status page."""
        return await self.repo.get_all_with_status()
