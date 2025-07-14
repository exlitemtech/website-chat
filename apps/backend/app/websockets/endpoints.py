import json
import uuid
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.db.database import get_db
from app.models.conversation import Conversation, Message
from app.models.website import Website
from app.models.user import User
from app.api.auth import get_current_user_websocket
from .connection_manager import connection_manager

router = APIRouter()

@router.websocket("/agent/{user_id}")
async def websocket_agent_endpoint(
    websocket: WebSocket,
    user_id: str,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """WebSocket endpoint for agents/admin users"""
    
    # Authenticate user
    try:
        user = await get_current_user_websocket(token, db)
        if not user or str(user.id) != user_id:
            print(f"Authentication failed: user={user}, user_id={user_id}")
            await websocket.close(code=4001, reason="Unauthorized")
            return
    except Exception as e:
        print(f"Authentication error: {e}")
        await websocket.close(code=4001, reason="Authentication failed")
        return
    
    connection_id = str(uuid.uuid4())
    
    try:
        print(f"Attempting to connect WebSocket for agent {user_id}")
        # Connect to WebSocket
        await connection_manager.connect(
            websocket=websocket,
            connection_id=connection_id,
            user_id=user_id,
            connection_type="agent"
        )
        print(f"WebSocket connected successfully for agent {user_id}")
        
        # Send connection confirmation immediately (no delay needed)
        try:
            await connection_manager.send_personal_message({
                "type": "connection_established",
                "connection_id": connection_id,
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat()
            }, connection_id)
            print(f"✅ Sent connection confirmation to {connection_id}")
        except WebSocketDisconnect:
            print(f"🔌 Client disconnected before confirmation could be sent to {connection_id}")
            return  # Exit early if client already disconnected
        except Exception as e:
            print(f"❌ Failed to send connection confirmation: {e}")
            # Don't close connection just because initial message failed
        
        # Handle incoming messages
        while True:
            try:
                data = await websocket.receive_text()
                message_data = json.loads(data)
                
                await handle_agent_message(message_data, connection_id, user_id, db)
                
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                await connection_manager.send_personal_message({
                    "type": "error",
                    "message": "Invalid JSON format"
                }, connection_id)
            except Exception as e:
                await connection_manager.send_personal_message({
                    "type": "error", 
                    "message": f"Error processing message: {str(e)}"
                }, connection_id)
                
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error for agent {user_id}: {e}")
        try:
            await websocket.close(code=4000, reason=f"Connection error: {str(e)}")
        except:
            pass
    finally:
        connection_manager.disconnect(connection_id)

@router.websocket("/visitor/{website_id}")
async def websocket_visitor_endpoint(
    websocket: WebSocket,
    website_id: str,
    visitor_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """WebSocket endpoint for website visitors"""
    
    # Verify website exists
    website = db.query(Website).filter(Website.id == website_id).first()
    if not website:
        await websocket.close(code=4004, reason="Website not found")
        return
    
    # Generate visitor ID if not provided
    if not visitor_id:
        visitor_id = f"visitor_{uuid.uuid4()}"
    
    connection_id = str(uuid.uuid4())
    
    try:
        # Connect to WebSocket
        await connection_manager.connect(
            websocket=websocket,
            connection_id=connection_id,
            user_id=visitor_id,
            connection_type="visitor",
            website_id=website_id,
            visitor_id=visitor_id
        )
        
        # Give WebSocket a moment to be ready before sending initial message
        await asyncio.sleep(0.1)
        
        # Send connection confirmation
        await connection_manager.send_personal_message({
            "type": "connection_established",
            "connection_id": connection_id,
            "visitor_id": visitor_id,
            "website_id": website_id,
            "timestamp": datetime.utcnow().isoformat()
        }, connection_id)
        
        # Handle incoming messages
        while True:
            try:
                data = await websocket.receive_text()
                message_data = json.loads(data)
                
                await handle_visitor_message(message_data, connection_id, visitor_id, website_id, db)
                
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                await connection_manager.send_personal_message({
                    "type": "error",
                    "message": "Invalid JSON format"
                }, connection_id)
            except Exception as e:
                await connection_manager.send_personal_message({
                    "type": "error",
                    "message": f"Error processing message: {str(e)}"
                }, connection_id)
                
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error for visitor {visitor_id}: {e}")
        try:
            await websocket.close(code=4000, reason=f"Connection error: {str(e)}")
        except:
            pass
    finally:
        connection_manager.disconnect(connection_id)

async def handle_agent_message(message_data: dict, connection_id: str, user_id: str, db: Session):
    """Handle messages from agents"""
    message_type = message_data.get("type")
    
    if message_type == "ping":
        # Respond to heartbeat ping
        await connection_manager.send_personal_message({
            "type": "pong",
            "timestamp": datetime.utcnow().isoformat()
        }, connection_id)
        return
    
    elif message_type == "join_conversation":
        conversation_id = message_data.get("conversation_id")
        if conversation_id:
            # Subscribe to conversation updates
            connection_manager.subscribe_to_conversation(connection_id, conversation_id)
            
            # Notify other participants
            await connection_manager.broadcast_to_conversation({
                "type": "agent_joined",
                "user_id": user_id,
                "conversation_id": conversation_id,
                "timestamp": datetime.utcnow().isoformat()
            }, conversation_id, exclude_connection=connection_id)
    
    elif message_type == "leave_conversation":
        conversation_id = message_data.get("conversation_id")
        if conversation_id:
            connection_manager.unsubscribe_from_conversation(connection_id, conversation_id)
            
            # Notify other participants
            await connection_manager.broadcast_to_conversation({
                "type": "agent_left",
                "user_id": user_id,
                "conversation_id": conversation_id,
                "timestamp": datetime.utcnow().isoformat()
            }, conversation_id)
    
    elif message_type == "send_message":
        await handle_send_message(message_data, connection_id, user_id, "agent", db)
    
    elif message_type == "typing_start":
        conversation_id = message_data.get("conversation_id")
        if conversation_id:
            await connection_manager.broadcast_to_conversation({
                "type": "typing_start",
                "user_id": user_id,
                "sender_type": "agent",
                "conversation_id": conversation_id,
                "timestamp": datetime.utcnow().isoformat()
            }, conversation_id, exclude_connection=connection_id)
    
    elif message_type == "typing_stop":
        conversation_id = message_data.get("conversation_id")
        if conversation_id:
            await connection_manager.broadcast_to_conversation({
                "type": "typing_stop",
                "user_id": user_id,
                "sender_type": "agent", 
                "conversation_id": conversation_id,
                "timestamp": datetime.utcnow().isoformat()
            }, conversation_id, exclude_connection=connection_id)

async def handle_visitor_message(message_data: dict, connection_id: str, visitor_id: str, 
                                website_id: str, db: Session):
    """Handle messages from visitors"""
    message_type = message_data.get("type")
    
    if message_type == "ping":
        # Respond to heartbeat ping
        await connection_manager.send_personal_message({
            "type": "pong",
            "timestamp": datetime.utcnow().isoformat()
        }, connection_id)
        return
    
    elif message_type == "join_conversation":
        conversation_id = message_data.get("conversation_id")
        if conversation_id:
            connection_manager.subscribe_to_conversation(connection_id, conversation_id)
            
            # Notify agents about visitor joining
            await connection_manager.broadcast_to_conversation({
                "type": "visitor_joined",
                "visitor_id": visitor_id,
                "conversation_id": conversation_id,
                "timestamp": datetime.utcnow().isoformat()
            }, conversation_id, exclude_connection=connection_id)
    
    elif message_type == "send_message":
        await handle_send_message(message_data, connection_id, visitor_id, "visitor", db)
    
    elif message_type == "typing_start":
        conversation_id = message_data.get("conversation_id")
        if conversation_id:
            await connection_manager.broadcast_to_conversation({
                "type": "typing_start",
                "visitor_id": visitor_id,
                "sender_type": "visitor",
                "conversation_id": conversation_id,
                "timestamp": datetime.utcnow().isoformat()
            }, conversation_id, exclude_connection=connection_id)
    
    elif message_type == "typing_stop":
        conversation_id = message_data.get("conversation_id")
        if conversation_id:
            await connection_manager.broadcast_to_conversation({
                "type": "typing_stop",
                "visitor_id": visitor_id,
                "sender_type": "visitor",
                "conversation_id": conversation_id,
                "timestamp": datetime.utcnow().isoformat()
            }, conversation_id, exclude_connection=connection_id)

async def handle_send_message(message_data: dict, connection_id: str, sender_id: str, 
                             sender_type: str, db: Session):
    """Handle sending a message in a conversation"""
    conversation_id = message_data.get("conversation_id")
    content = message_data.get("content")
    
    if not conversation_id or not content:
        await connection_manager.send_personal_message({
            "type": "error",
            "message": "conversation_id and content are required"
        }, connection_id)
        return
    
    try:
        # Create message in database
        message = Message(
            id=str(uuid.uuid4()),
            conversation_id=conversation_id,
            sender_id=sender_id,
            sender=sender_type,
            content=content,
            message_metadata=message_data.get("metadata", {})
        )
        
        db.add(message)
        
        # Update conversation
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if conversation:
            conversation.last_message_at = datetime.utcnow()
            conversation.updated_at = datetime.utcnow()
            
            if sender_type == "agent":
                conversation.status = "active"
                conversation.last_agent_read_at = datetime.utcnow()
        
        db.commit()
        db.refresh(message)
        
        # Broadcast message to all conversation participants
        broadcast_message = {
            "type": "new_message",
            "message": {
                "id": message.id,
                "conversation_id": conversation_id,
                "content": content,
                "sender": sender_type,
                "sender_id": sender_id,
                "timestamp": message.created_at.isoformat(),
                "metadata": message.message_metadata
            }
        }
        
        await connection_manager.broadcast_to_conversation(
            broadcast_message, 
            conversation_id
        )
        
    except Exception as e:
        await connection_manager.send_personal_message({
            "type": "error",
            "message": f"Failed to send message: {str(e)}"
        }, connection_id)

@router.get("/stats")
async def get_websocket_stats():
    """Get WebSocket connection statistics"""
    return connection_manager.get_connection_stats()