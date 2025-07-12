from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.api.auth import get_current_user
from app.models.user import User, UserRole, UserStatus
from app.core.security import get_password_hash
from app.schemas.user import UserCreate, UserUpdate, UserResponse
import uuid

router = APIRouter()

def check_admin_access(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

@router.get("/", response_model=List[UserResponse])
async def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Admin can see all users, managers can see agents, agents only see themselves
    if current_user.role == UserRole.ADMIN:
        users = db.query(User).all()
    elif current_user.role == UserRole.MANAGER:
        users = db.query(User).filter(
            User.role.in_([UserRole.AGENT, UserRole.MANAGER])
        ).all()
    else:
        users = [current_user]
    
    return users

@router.post("/", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(check_admin_access)
):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    new_user = User(
        id=str(uuid.uuid4()),
        email=user_data.email,
        name=user_data.name,
        hashed_password=get_password_hash(user_data.password),
        role=user_data.role,
        status=user_data.status or UserStatus.PENDING,
        avatar=user_data.avatar
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Users can only view their own profile unless they're admin/manager
    if (current_user.id != user_id and 
        current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return user

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Only admin can update other users, users can update their own profile (limited fields)
    if current_user.id != user_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Update user fields
    update_data = user_data.model_dump(exclude_unset=True)
    
    # Non-admin users can only update limited fields
    if current_user.id == user_id and current_user.role != UserRole.ADMIN:
        allowed_fields = {"name", "avatar"}
        update_data = {k: v for k, v in update_data.items() if k in allowed_fields}
    
    # Hash password if provided
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return user

@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    admin_user: User = Depends(check_admin_access)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent admin from deleting themselves
    if user_id == admin_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}