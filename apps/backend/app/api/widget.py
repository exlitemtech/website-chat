from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from pydantic import BaseModel
import uuid
from datetime import datetime

from app.db.database import get_db
from app.models.website import Website
from app.models.visitor import Visitor
from app.models.conversation import Conversation, Message, MessageType
from app.websockets.connection_manager import connection_manager

router = APIRouter()

class WidgetMessageRequest(BaseModel):
    content: str
    visitorId: Optional[str] = None
    websiteId: str
    conversationId: Optional[str] = None

class WidgetMessageResponse(BaseModel):
    success: bool
    message: Optional[dict] = None
    conversationId: Optional[str] = None
    error: Optional[str] = None

@router.post("/message", response_model=WidgetMessageResponse)
async def send_widget_message(
    request: WidgetMessageRequest,
    db: Session = Depends(get_db)
):
    """
    Public endpoint for chat widget to send messages
    This is a fallback for when WebSocket is not available
    """
    try:
        # Get or create website
        website = db.query(Website).filter(Website.id == request.websiteId).first()
        if not website:
            # Create demo website for testing
            website = Website(
                id=request.websiteId,
                name="Demo Website",
                domain="localhost:8001"
            )
            db.add(website)
            db.flush()
        
        # Get or create visitor
        visitor = None
        if request.visitorId:
            visitor = db.query(Visitor).filter(Visitor.id == request.visitorId).first()
        
        if not visitor:
            # Create anonymous visitor with the provided visitor ID
            visitor = Visitor(
                id=request.visitorId,  # Use the provided visitor ID
                website_id=request.websiteId,
                is_identified=False
            )
            db.add(visitor)
            db.flush()
        
        # Get or create conversation
        conversation = None
        if request.conversationId:
            conversation = db.query(Conversation).filter(
                Conversation.id == request.conversationId
            ).first()
        
        if not conversation:
            # Create new conversation
            conversation = Conversation(
                id=str(uuid.uuid4()),
                website_id=request.websiteId,
                visitor_id=visitor.id,
                status="active",
                priority="normal"
            )
            db.add(conversation)
            db.flush()
        
        # Create message
        message = Message(
            id=str(uuid.uuid4()),
            conversation_id=conversation.id,
            sender="visitor",
            sender_id=visitor.id,
            content=request.content,
            type=MessageType.TEXT
        )
        db.add(message)
        
        db.commit()
        
        # Broadcast the message to connected agents via WebSocket
        try:
            message_data = {
                "id": message.id,
                "content": message.content,
                "sender": message.sender,
                "sender_id": message.sender_id,
                "timestamp": message.created_at.isoformat(),
                "conversation_id": conversation.id,
                "type": "text"
            }
            
            print(f"📡 Widget API: Broadcasting message to conversation {conversation.id}")
            await connection_manager.broadcast_to_conversation({
                "type": "new_message",
                "message": message_data
            }, conversation.id)
            print(f"📡 Widget API: Message broadcast completed")
            
        except Exception as broadcast_error:
            print(f"❌ Widget API: Failed to broadcast message: {broadcast_error}")
            # Don't fail the API request if broadcasting fails
        
        # Return response in expected format
        return WidgetMessageResponse(
            success=True,
            conversationId=conversation.id,
            message={
                "id": message.id,
                "content": message.content,
                "sender": "visitor",
                "timestamp": message.created_at.isoformat(),
                "type": "text"
            }
        )
        
    except Exception as e:
        db.rollback()
        return WidgetMessageResponse(
            success=False,
            error=str(e)
        )

@router.get("/conversation/{visitor_id}")
async def get_visitor_conversation(
    visitor_id: str,
    website_id: str,
    db: Session = Depends(get_db)
):
    """Get conversation history for a visitor"""
    try:
        # Find the visitor's conversation for this website
        conversation = db.query(Conversation).filter(
            Conversation.visitor_id == visitor_id,
            Conversation.website_id == website_id
        ).order_by(desc(Conversation.created_at)).first()
        
        if not conversation:
            return {"conversationId": None, "messages": []}
        
        # Get all messages for this conversation
        messages = db.query(Message).filter(
            Message.conversation_id == conversation.id
        ).order_by(Message.created_at).all()
        
        formatted_messages = []
        for msg in messages:
            formatted_messages.append({
                "id": msg.id,
                "content": msg.content,
                "sender": msg.sender,
                "timestamp": msg.created_at.isoformat(),
                "type": "text"
            })
        
        return {
            "conversationId": conversation.id,
            "messages": formatted_messages
        }
        
    except Exception as e:
        return {"conversationId": None, "messages": [], "error": str(e)}

@router.get("/debug/visitors")
async def debug_visitors(db: Session = Depends(get_db)):
    """Debug endpoint to see all visitors"""
    visitors = db.query(Visitor).all()
    return [{"id": v.id, "website_id": v.website_id} for v in visitors]