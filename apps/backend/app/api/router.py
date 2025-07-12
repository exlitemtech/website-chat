from fastapi import APIRouter
from .auth import router as auth_router
from .users import router as users_router
from .demo import router as demo_router

api_router = APIRouter()

@api_router.get("/")
async def api_root():
    return {"message": "Website Chat API v1"}

# Include demo routes for testing without database
api_router.include_router(demo_router, prefix="/demo", tags=["demo"])

# Include authentication and user management routes
api_router.include_router(auth_router, prefix="/auth", tags=["authentication"])
api_router.include_router(users_router, prefix="/users", tags=["users"])

# Website management routes
from .v1.websites import router as websites_router
api_router.include_router(websites_router, prefix="/websites", tags=["websites"])

# Conversation management routes
from .v1.conversations import router as conversations_router
api_router.include_router(conversations_router, prefix="/conversations", tags=["conversations"])

# Widget public endpoints (no authentication required)
from .widget import router as widget_router
api_router.include_router(widget_router, prefix="/widget", tags=["widget"])