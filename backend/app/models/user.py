"""User models for authentication"""

from enum import Enum
from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class UserRole(str, Enum):
    """User role enum for access control"""
    admin = "admin"
    readonly = "readonly"


class Token(BaseModel):
    """JWT Token response"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token payload data"""
    username: Optional[str] = None


class UserBase(BaseModel):
    """Base user model"""
    username: str = Field(..., min_length=3, max_length=50)
    email: Optional[str] = None
    role: UserRole = UserRole.readonly


class UserCreate(BaseModel):
    """User creation model"""
    username: str = Field(..., min_length=3, max_length=50)
    email: Optional[str] = None
    password: str = Field(..., min_length=4, max_length=100)
    role: UserRole = UserRole.readonly


class User(UserBase):
    """User response model"""
    is_active: bool = True

    class Config:
        from_attributes = True


class UserInDB(User):
    """User model with hashed password (for internal use)"""
    hashed_password: str
