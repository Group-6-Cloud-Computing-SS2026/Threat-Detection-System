"""
Threat Detection System — Custom Exceptions

Application-specific exception hierarchy for clean error handling.
"""

from typing import Any


class AppException(Exception):
    """Base exception for the Threat Detection System."""

    def __init__(self, detail: str = "An unexpected error occurred", status_code: int = 500):
        self.detail = detail
        self.status_code = status_code
        super().__init__(self.detail)


class NotFoundException(AppException):
    """Resource not found."""

    def __init__(self, resource: str = "Resource", identifier: Any = None):
        detail = f"{resource} not found"
        if identifier is not None:
            detail = f"{resource} with id '{identifier}' not found"
        super().__init__(detail=detail, status_code=404)


class ConflictException(AppException):
    """Duplicate or conflicting resource."""

    def __init__(self, detail: str = "Resource already exists"):
        super().__init__(detail=detail, status_code=409)


class UnauthorizedException(AppException):
    """Authentication failure."""

    def __init__(self, detail: str = "Invalid credentials"):
        super().__init__(detail=detail, status_code=401)


class ForbiddenException(AppException):
    """Insufficient permissions."""

    def __init__(self, detail: str = "Insufficient permissions"):
        super().__init__(detail=detail, status_code=403)


class BadRequestException(AppException):
    """Malformed or invalid request data."""

    def __init__(self, detail: str = "Bad request"):
        super().__init__(detail=detail, status_code=400)


class ServiceUnavailableException(AppException):
    """External dependency is unreachable."""

    def __init__(self, service: str = "Service"):
        super().__init__(
            detail=f"{service} is currently unavailable",
            status_code=503,
        )
