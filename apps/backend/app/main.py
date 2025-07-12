from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import api_router
from app.websockets.endpoints import router as websocket_router
from app.core.config import settings

app = FastAPI(
    title="Website Chat API",
    description="Backend API for multi-website chat application",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
app.include_router(websocket_router, prefix="/ws", tags=["websockets"])

@app.get("/")
async def root():
    return {"message": "Website Chat API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Socket.IO functionality moved to WebSocket endpoints