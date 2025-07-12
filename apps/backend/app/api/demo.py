from fastapi import APIRouter, HTTPException, status
from app.schemas.auth import LoginRequest, LoginResponse
from app.core.security import create_access_token, create_refresh_token, verify_password, get_password_hash

router = APIRouter()

# Demo user for testing (in production this would be in database)
DEMO_USER = {
    "id": "demo-user-123",
    "email": "admin@example.com",
    "name": "Demo Admin",
    "role": "admin",
    "hashed_password": get_password_hash("password123"),
    "websiteIds": ["demo-website-1", "demo-website-2"]
}

@router.post("/login", response_model=LoginResponse)
async def demo_login(login_data: LoginRequest):
    """Demo login endpoint for testing with database lookup"""
    from app.db.database import get_db
    from app.models.user import User
    
    db = next(get_db())
    
    # Look up actual user in database
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    
    return LoginResponse(
        accessToken=access_token,
        refreshToken=refresh_token,
        user={
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "websiteIds": ["demo-website-1"]  # For now, hardcode
        }
    )

@router.post("/setup")
async def setup_demo_data():
    """Setup demo data for testing"""
    from app.db.database import get_db
    from app.models.website import Website
    from app.models.user import User, UserRole, UserStatus
    from sqlalchemy.exc import IntegrityError
    
    db = next(get_db())
    
    try:
        # Get or create demo user by email
        user = db.query(User).filter(User.email == DEMO_USER["email"]).first()
        if not user:
            user = User(
                id=DEMO_USER["id"],
                email=DEMO_USER["email"],
                name=DEMO_USER["name"],
                role=UserRole.ADMIN,
                hashed_password=DEMO_USER["hashed_password"],
                status=UserStatus.ACTIVE
            )
            db.add(user)
            db.flush()
        
        # Create demo website if not exists
        website = db.query(Website).filter(Website.id == "demo-website-1").first()
        if not website:
            website = Website(
                id="demo-website-1",
                name="Demo Website",
                domain="localhost:8001"
            )
            db.add(website)
            db.flush()
            
            # Associate website with user if not already associated
            if website not in user.websites:
                user.websites.append(website)
        
        db.commit()
        return {"success": True, "message": "Demo data setup complete"}
        
    except Exception as e:
        db.rollback()
        return {"success": False, "error": str(e)}