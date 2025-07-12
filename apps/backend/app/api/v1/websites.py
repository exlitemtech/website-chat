from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.website import Website
from app.models.user import User
from app.api.auth import get_current_user
from pydantic import BaseModel
import uuid

router = APIRouter()

class WidgetConfig(BaseModel):
    primaryColor: str = "#6366f1"
    position: str = "bottom-right"
    welcomeMessage: str = "Hi! How can we help you today?"
    agentName: str = "Support Team"
    agentAvatar: str = None
    enableFileUpload: bool = True
    enableEmoji: bool = True
    offlineMessage: str = "We are currently offline. Leave us a message!"

class WebsiteCreate(BaseModel):
    name: str
    domain: str
    widget_config: WidgetConfig = WidgetConfig()

class WebsiteUpdate(BaseModel):
    name: str = None
    domain: str = None
    widget_config: WidgetConfig = None
    is_active: bool = None

class WebsiteResponse(BaseModel):
    id: str
    name: str
    domain: str
    widget_config: dict
    is_active: bool
    created_at: str
    updated_at: str = None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[WebsiteResponse])
async def get_websites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all websites for the current user"""
    websites = db.query(Website).filter(
        Website.users.any(User.id == current_user.id)
    ).all()
    
    return [
        WebsiteResponse(
            id=website.id,
            name=website.name,
            domain=website.domain,
            widget_config=website.widget_config,
            is_active=website.is_active,
            created_at=website.created_at.isoformat(),
            updated_at=website.updated_at.isoformat() if website.updated_at else None
        )
        for website in websites
    ]

@router.post("/", response_model=WebsiteResponse)
async def create_website(
    website_data: WebsiteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new website"""
    
    # Check if domain already exists
    existing_website = db.query(Website).filter(Website.domain == website_data.domain).first()
    if existing_website:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A website with this domain already exists"
        )
    
    # Create website
    website = Website(
        id=str(uuid.uuid4()),
        name=website_data.name,
        domain=website_data.domain,
        widget_config=website_data.widget_config.dict()
    )
    
    # Add current user as website admin
    website.users.append(current_user)
    
    db.add(website)
    db.commit()
    db.refresh(website)
    
    return WebsiteResponse(
        id=website.id,
        name=website.name,
        domain=website.domain,
        widget_config=website.widget_config,
        is_active=website.is_active,
        created_at=website.created_at.isoformat(),
        updated_at=website.updated_at.isoformat() if website.updated_at else None
    )

@router.get("/{website_id}", response_model=WebsiteResponse)
async def get_website(
    website_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific website"""
    website = db.query(Website).filter(
        Website.id == website_id,
        Website.users.any(User.id == current_user.id)
    ).first()
    
    if not website:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Website not found"
        )
    
    return WebsiteResponse(
        id=website.id,
        name=website.name,
        domain=website.domain,
        widget_config=website.widget_config,
        is_active=website.is_active,
        created_at=website.created_at.isoformat(),
        updated_at=website.updated_at.isoformat() if website.updated_at else None
    )

@router.put("/{website_id}", response_model=WebsiteResponse)
async def update_website(
    website_id: str,
    website_data: WebsiteUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a website"""
    website = db.query(Website).filter(
        Website.id == website_id,
        Website.users.any(User.id == current_user.id)
    ).first()
    
    if not website:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Website not found"
        )
    
    # Update fields
    if website_data.name is not None:
        website.name = website_data.name
    if website_data.domain is not None:
        # Check if new domain already exists
        existing_website = db.query(Website).filter(
            Website.domain == website_data.domain,
            Website.id != website_id
        ).first()
        if existing_website:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A website with this domain already exists"
            )
        website.domain = website_data.domain
    if website_data.widget_config is not None:
        website.widget_config = website_data.widget_config.dict()
    if website_data.is_active is not None:
        website.is_active = website_data.is_active
    
    db.commit()
    db.refresh(website)
    
    return WebsiteResponse(
        id=website.id,
        name=website.name,
        domain=website.domain,
        widget_config=website.widget_config,
        is_active=website.is_active,
        created_at=website.created_at.isoformat(),
        updated_at=website.updated_at.isoformat() if website.updated_at else None
    )

@router.delete("/{website_id}")
async def delete_website(
    website_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a website"""
    website = db.query(Website).filter(
        Website.id == website_id,
        Website.users.any(User.id == current_user.id)
    ).first()
    
    if not website:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Website not found"
        )
    
    db.delete(website)
    db.commit()
    
    return {"message": "Website deleted successfully"}

@router.get("/{website_id}/integration-code")
async def get_integration_code(
    website_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get integration code for a website"""
    website = db.query(Website).filter(
        Website.id == website_id,
        Website.users.any(User.id == current_user.id)
    ).first()
    
    if not website:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Website not found"
        )
    
    config = website.widget_config
    
    # Generate HTML integration code
    html_code = f'''<!-- Website Chat Widget -->
<link rel="stylesheet" href="https://cdn.yoursite.com/website-chat-widget.css">
<script 
    src="https://cdn.yoursite.com/website-chat-widget.iife.js"
    data-website-id="{website.id}"
    data-api-url="https://api.yoursite.com"
    data-primary-color="{config.get('primaryColor', '#6366f1')}"
    data-position="{config.get('position', 'bottom-right')}"
    data-welcome-message="{config.get('welcomeMessage', 'Hi! How can we help you today?')}"
    data-agent-name="{config.get('agentName', 'Support Team')}"
    {f'data-agent-avatar="{config["agentAvatar"]}"' if config.get('agentAvatar') else ''}
    data-enable-file-upload="{str(config.get('enableFileUpload', True)).lower()}"
    data-enable-emoji="{str(config.get('enableEmoji', True)).lower()}"
></script>'''
    
    # Generate JavaScript integration code
    js_code = f'''WebsiteChat.init({{
  websiteId: '{website.id}',
  apiUrl: 'https://api.yoursite.com',
  primaryColor: '{config.get('primaryColor', '#6366f1')}',
  position: '{config.get('position', 'bottom-right')}',
  welcomeMessage: '{config.get('welcomeMessage', 'Hi! How can we help you today?')}',
  agentName: '{config.get('agentName', 'Support Team')}',{f"""
  agentAvatar: '{config['agentAvatar']}',""" if config.get('agentAvatar') else ''}
  enableFileUpload: {str(config.get('enableFileUpload', True)).lower()},
  enableEmoji: {str(config.get('enableEmoji', True)).lower()}
}});'''
    
    return {
        "website_id": website.id,
        "html_code": html_code,
        "js_code": js_code,
        "config": config
    }