from sqlalchemy import Boolean, Column, DateTime, String, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
from app.models.user import user_website_association

class Website(Base):
    __tablename__ = "websites"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    domain = Column(String, nullable=False, index=True)
    widget_config = Column(JSON, nullable=False, default={
        "primaryColor": "#6366f1",
        "position": "bottom-right",
        "welcomeMessage": "Hi! How can we help you today?",
        "agentName": "Support Team",
        "agentAvatar": None,
        "enableFileUpload": True,
        "enableEmoji": True,
        "offlineMessage": "We are currently offline. Leave us a message!"
    })
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    users = relationship("User", secondary=user_website_association, back_populates="websites")
    visitors = relationship("Visitor", back_populates="website")
    conversations = relationship("Conversation", back_populates="website")