"""
Auth service — user registration, login, and JWT management.
"""

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.user_repo import UserRepository
from app.utils.enums import UserRole
from app.utils.exceptions import ConflictException, UnauthorizedException
from app.utils.security import create_access_token, hash_password, verify_password
from app.utils.time_utils import utc_now


class AuthService:
    def __init__(self, db: AsyncSession):
        self.repo = UserRepository(db)

    async def register(self, username: str, email: str, password: str, role: str = UserRole.VIEWER):
        """Register a new user. Raises ConflictException if username/email taken."""
        if await self.repo.get_by_username(username):
            raise ConflictException(f"Username '{username}' is already taken")
        if await self.repo.get_by_email(email):
            raise ConflictException(f"Email '{email}' is already registered")

        user = await self.repo.create({
            "username": username,
            "email": email,
            "hashed_password": hash_password(password),
            "role": role,
            "is_active": True,
            "created_at": utc_now(),
            "updated_at": utc_now(),
        })
        return user

    async def login(self, username: str, password: str) -> str:
        """Authenticate and return a JWT access token."""
        user = await self.repo.get_by_username(username)
        if not user or not verify_password(password, user.hashed_password):
            raise UnauthorizedException("Invalid username or password")
        if not user.is_active:
            raise UnauthorizedException("Account is deactivated")

        return create_access_token(data={"sub": str(user.id), "role": user.role})

    async def get_user_by_id(self, user_id: UUID):
        """Fetch user by ID (for JWT validation)."""
        return await self.repo.get_by_id(user_id)

    async def change_password(self, user_id: UUID, old_password: str, new_password: str) -> None:
        """Change a user's password after verifying the old one."""
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise UnauthorizedException("User not found")
        if not verify_password(old_password, user.hashed_password):
            raise UnauthorizedException("Current password is incorrect")

        await self.repo.update(user_id, {
            "hashed_password": hash_password(new_password),
            "updated_at": utc_now(),
        })
