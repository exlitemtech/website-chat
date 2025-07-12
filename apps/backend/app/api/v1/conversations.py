from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, or_
from typing import List, Optional
from datetime import datetime
from app.db.database import get_db
from app.models.conversation import Conversation, Message, MessageType
from app.models.website import Website
from app.models.visitor import Visitor
from app.models.user import User
from app.api.auth import get_current_user
from pydantic import BaseModel
import uuid

router = APIRouter()

class MessageCreate(BaseModel):
    content: str
    sender: str = "agent"  # agent or visitor

class MessageResponse(BaseModel):
    id: str
    content: str
    sender: str
    timestamp: datetime
    message_metadata: dict = {}

    class Config:
        from_attributes = True

class ConversationListResponse(BaseModel):
    id: str
    website_name: str
    website_domain: str
    visitor_name: str
    visitor_email: Optional[str] = None
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None
    status: str
    unread_count: int = 0
    created_at: datetime
    
    class Config:
        from_attributes = True

class ConversationDetailResponse(BaseModel):
    id: str
    website_id: str
    website_name: str
    website_domain: str
    visitor_id: str
    visitor_name: str
    visitor_email: Optional[str] = None
    visitor_metadata: dict = {}
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    messages: List[MessageResponse] = []
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[ConversationListResponse])
async def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    status_filter: Optional[str] = Query(None, description="Filter by status: active, waiting, resolved"),
    website_id: Optional[str] = Query(None, description="Filter by website ID"),
    search: Optional[str] = Query(None, description="Search in visitor names or messages"),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0)
):
    """Get all conversations for the current user's websites"""
    
    # Build base query - simplified for debugging
    query = db.query(Conversation).join(Website)
    
    # Apply filters
    if status_filter:
        query = query.filter(Conversation.status == status_filter)
    
    if website_id:
        query = query.filter(Conversation.website_id == website_id)
    
    if search:
        query = query.join(Visitor).filter(
            or_(
                Visitor.name.ilike(f"%{search}%"),
                Visitor.email.ilike(f"%{search}%")
            )
        )
    
    # Get conversations for testing
    conversations = query.order_by(desc(Conversation.updated_at)).offset(offset).limit(limit).all()
    
    # Return conversation data with real messages
    result = []
    for conv in conversations:
        try:
            # Get last actual message
            last_message = db.query(Message).filter(
                Message.conversation_id == conv.id
            ).order_by(desc(Message.created_at)).first()
            
            result.append(ConversationListResponse(
                id=conv.id,
                website_name=conv.website.name if conv.website else "Unknown",
                website_domain=conv.website.domain if conv.website else "unknown.com",
                visitor_name=getattr(conv.visitor, 'name', None) or "Anonymous User",
                visitor_email=getattr(conv.visitor, 'email', None),
                last_message=last_message.content if last_message else "No messages",
                last_message_time=last_message.created_at if last_message else conv.created_at,
                status="active",
                unread_count=1,
                created_at=conv.created_at
            ))
        except Exception as e:
            print(f"Error processing conversation {conv.id}: {e}")
            continue
    
    return result

@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific conversation with full details and message history"""
    
    try:
        # Query with eager loading of relationships
        conversation = db.query(Conversation).filter(
            Conversation.id == conversation_id
        ).first()
        
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        # Get all messages for this conversation
        messages = db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).order_by(Message.created_at).all()
        
        # Safely get website information
        website_name = "Unknown Website"
        website_domain = "unknown.com"
        
        try:
            if conversation.website:
                website_name = conversation.website.name or "Unknown Website"
                website_domain = conversation.website.domain or "unknown.com"
        except Exception as e:
            print(f"Error accessing website data: {e}")
        
        # Safely get visitor information
        visitor_name = "Anonymous User"
        visitor_email = None
        visitor_metadata = {}
        
        try:
            if conversation.visitor:
                visitor_name = getattr(conversation.visitor, 'name', None) or "Anonymous User"
                visitor_email = getattr(conversation.visitor, 'email', None)
                visitor_metadata = getattr(conversation.visitor, 'custom_data', None) or {}
        except Exception as e:
            print(f"Error accessing visitor data: {e}")
        
        # Safely handle status
        status_value = "active"
        try:
            if hasattr(conversation.status, 'value'):
                status_value = conversation.status.value.lower()
            else:
                status_value = str(conversation.status).lower()
        except Exception as e:
            print(f"Error accessing status: {e}")
        
        # Mark as read by agent
        try:
            conversation.last_agent_read_at = datetime.utcnow()
            db.commit()
        except Exception as e:
            print(f"Error updating read timestamp: {e}")
            db.rollback()
        
        return ConversationDetailResponse(
            id=conversation.id,
            website_id=conversation.website_id,
            website_name=website_name,
            website_domain=website_domain,
            visitor_id=conversation.visitor_id,
            visitor_name=visitor_name,
            visitor_email=visitor_email,
            visitor_metadata=visitor_metadata,
            status=status_value,
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
            messages=[
                MessageResponse(
                    id=msg.id,
                    content=msg.content,
                    sender=msg.sender,
                    timestamp=msg.created_at,
                    message_metadata=msg.message_metadata or {}
                )
                for msg in messages
            ]
        )
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        print(f"Unexpected error in get_conversation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.post("/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(
    conversation_id: str,
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message in a conversation"""
    
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Create message - simplified
    message = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        sender_id=current_user.id,
        sender=message_data.sender,
        content=message_data.content,
        type=MessageType.TEXT
    )
    
    db.add(message)
    
    db.commit()
    db.refresh(message)
    
    return MessageResponse(
        id=message.id,
        content=message.content,
        sender=message.sender,
        timestamp=message.created_at,
        message_metadata={}
    )

@router.put("/{conversation_id}/status")
async def update_conversation_status(
    conversation_id: str,
    status: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update conversation status"""
    
    if status not in ["active", "waiting", "resolved"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status. Must be one of: active, waiting, resolved"
        )
    
    conversation = db.query(Conversation).join(Website).filter(
        Conversation.id == conversation_id,
        Website.users.any(User.id == current_user.id)
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    conversation.status = status
    conversation.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": f"Conversation status updated to {status}"}

@router.get("/stats/summary")
async def get_conversation_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get conversation statistics for the dashboard"""
    
    # Get conversations from user's websites
    base_query = db.query(Conversation).join(Website).filter(
        Website.users.any(User.id == current_user.id)
    )
    
    total_conversations = base_query.count()
    active_conversations = base_query.filter(Conversation.status == "active").count()
    waiting_conversations = base_query.filter(Conversation.status == "waiting").count()
    resolved_conversations = base_query.filter(Conversation.status == "resolved").count()
    
    # Count total unread messages
    unread_messages = db.query(Message).join(Conversation).join(Website).filter(
        Website.users.any(User.id == current_user.id),
        Message.sender == "visitor",
        or_(
            Conversation.last_agent_read_at == None,
            Message.created_at > Conversation.last_agent_read_at
        )
    ).count()
    
    return {
        "total_conversations": total_conversations,
        "active_conversations": active_conversations,
        "waiting_conversations": waiting_conversations,
        "resolved_conversations": resolved_conversations,
        "unread_messages": unread_messages
    }