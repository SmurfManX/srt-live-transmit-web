"""API routers"""

from .auth import router as auth_router
from .channels import router as channels_router
from .system import router as system_router
from .users import router as users_router

__all__ = [
    "auth_router",
    "channels_router",
    "system_router",
    "users_router",
]
