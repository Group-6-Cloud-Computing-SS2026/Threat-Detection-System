"""
Generic CRUD repository base class.

All domain-specific repositories inherit from this and add custom queries.
"""

from typing import Any, Generic, Type, TypeVar
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Provides generic create, read, update, delete operations."""

    def __init__(self, model: Type[ModelType], db: AsyncSession):
        self.model = model
        self.db = db

    async def create(self, obj_in: dict[str, Any]) -> ModelType:
        """Insert a new record."""
        instance = self.model(**obj_in)
        self.db.add(instance)
        await self.db.flush()
        await self.db.refresh(instance)
        return instance

    async def get_by_id(self, id: UUID) -> ModelType | None:
        """Fetch a single record by primary key."""
        return await self.db.get(self.model, id)

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 50,
        filters: dict[str, Any] | None = None,
    ) -> list[ModelType]:
        """Fetch records with optional equality filters and pagination."""
        stmt = select(self.model)
        if filters:
            for key, value in filters.items():
                if value is not None and hasattr(self.model, key):
                    stmt = stmt.where(getattr(self.model, key) == value)
        stmt = stmt.offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def count(self, filters: dict[str, Any] | None = None) -> int:
        """Count records matching optional filters."""
        stmt = select(func.count()).select_from(self.model)
        if filters:
            for key, value in filters.items():
                if value is not None and hasattr(self.model, key):
                    stmt = stmt.where(getattr(self.model, key) == value)
        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def update(self, id: UUID, obj_in: dict[str, Any]) -> ModelType | None:
        """Update an existing record by primary key."""
        instance = await self.get_by_id(id)
        if instance is None:
            return None
        for key, value in obj_in.items():
            if value is not None and hasattr(instance, key):
                setattr(instance, key, value)
        await self.db.flush()
        await self.db.refresh(instance)
        return instance

    async def delete(self, id: UUID) -> bool:
        """Delete a record by primary key."""
        instance = await self.get_by_id(id)
        if instance is None:
            return False
        await self.db.delete(instance)
        await self.db.flush()
        return True
