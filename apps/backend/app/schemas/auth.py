from pydantic import BaseModel
from typing import List

class LoginRequest(BaseModel):
    email: str
    password: str

class UserInfo(BaseModel):
    id: str
    email: str
    name: str
    role: str
    websiteIds: List[str]

class LoginResponse(BaseModel):
    accessToken: str
    refreshToken: str
    user: UserInfo

class RefreshTokenRequest(BaseModel):
    refreshToken: str

class RefreshTokenResponse(BaseModel):
    accessToken: str
    refreshToken: str