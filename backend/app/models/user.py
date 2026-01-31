"""User models for authentication"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional


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


class UserCreate(UserBase):
    """User creation model"""
    password: str = Field(..., min_length=4, max_length=100)


class User(UserBase):
    """User response model"""
    is_active: bool = True

    class Config:
        from_attributes = True


class UserInDB(User):
    """User model with hashed password (for internal use)"""
    hashed_password: str
