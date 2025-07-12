from sqlalchemy import Boolean, Column, DateTime, String, Enum, ForeignKey, Integer, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base

class ConversationStatus(str, enum.Enum):
    ACTIVE = "active"
    WAITING = "waiting"
    RESOLVED = "resolved"
    ARCHIVED = "archived"

class MessageType(str, enum.Enum):
    TEXT = "text"
    IMAGE = "image"
    FILE = "file"
    SYSTEM = "system"

class SenderType(str, enum.Enum):
    VISITOR = "visitor"
    AGENT = "agent"

class Priority(str, enum.Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, index=True)
    website_id = Column(String, ForeignKey("websites.id"), nullable=False)
    visitor_id = Column(String, ForeignKey("visitors.id"), nullable=False)
    assigned_agent_id = Column(String, ForeignKey("users.id"), nullable=True)
    status = Column(Enum(ConversationStatus), default=ConversationStatus.ACTIVE)
    subject = Column(String, nullable=True)
    priority = Column(Enum(Priority), default=Priority.NORMAL)
    tags = Column(JSON, nullable=True, default=[])
    last_message_at = Column(DateTime(timezone=True), nullable=True)
    last_agent_read_at = Column(DateTime(timezone=True), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    rating = Column(Integer, nullable=True)  # 1-5 stars
    feedback = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    website = relationship("Website", back_populates="conversations")
    visitor = relationship("Visitor", back_populates="conversations")
    assigned_agent = relationship("User", back_populates="assigned_conversations")
    messages = relationship("Message", back_populates="conversation", order_by="Message.created_at")

class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, index=True)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    sender_id = Column(String, nullable=False)  # Can be visitor_id or user_id
    sender = Column(String, nullable=False)  # "visitor" or "agent" - simplified
    type = Column(Enum(MessageType), default=MessageType.TEXT)
    content = Column(Text, nullable=False)
    message_metadata = Column(JSON, nullable=True)  # For file info, etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")