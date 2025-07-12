from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.user import UserRole, UserStatus

class UserBase(BaseModel):
    email: str
    name: str
    avatar: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: UserRole
    status: Optional[UserStatus] = UserStatus.PENDING
    websiteIds: Optional[List[str]] = []

class UserUpdate(BaseModel):
    email: Optional[str] = None
    name: Optional[str] = None
    avatar: Optional[str] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None
    websiteIds: Optional[List[str]] = None

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    avatar: Optional[str]
    role: UserRole
    status: UserStatus
    created_at: datetime
    updated_at: Optional[datetime]
    last_login: Optional[datetime]
    
    class Config:
        from_attributes = True