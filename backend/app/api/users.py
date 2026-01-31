"""Users API router"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from ..models.user import User
from ..core.deps import get_current_active_user
from ..database import list_users, delete_user as db_delete_user, update_user_password

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("", response_model=List[dict])
async def get_users(current_user: User = Depends(get_current_active_user)):
    """Get list of all users"""
    return list_users()


@router.delete("/{username}")
async def delete_user_endpoint(
    username: str,
    current_user: User = Depends(get_current_active_user)
):
    """Delete a user (admin only)"""
    if current_user.username != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can delete users"
        )

    if username == "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete admin user"
        )

    success = db_delete_user(username)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return {"message": "User deleted successfully"}


@router.put("/{username}/password")
async def change_password(
    username: str,
    new_password: str,
    current_user: User = Depends(get_current_active_user)
):
    """Change user password"""
    if current_user.username != "admin" and current_user.username != username:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only change own password"
        )

    success = update_user_password(username, new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return {"message": "Password updated successfully"}
