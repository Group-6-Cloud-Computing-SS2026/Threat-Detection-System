"""
Auth schemas — login, register, and JWT token responses.
"""

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    """Credentials for authentication."""
    username: str = Field(..., min_length=3, max_length=150)
    password: str = Field(..., min_length=6)


class RegisterRequest(BaseModel):
    """Payload for creating a new user account."""
    username: str = Field(..., min_length=3, max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = Field("viewer", pattern="^(admin|operator|viewer)$")


class TokenResponse(BaseModel):
    """JWT access token response."""
    access_token: str
    token_type: str = "bearer"


class ChangePasswordRequest(BaseModel):
    """Payload for changing a user's password."""
    old_password: str = Field(..., min_length=6)
    new_password: str = Field(..., min_length=6)
