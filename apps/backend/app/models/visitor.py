from sqlalchemy import Boolean, Column, DateTime, String, JSON, ForeignKey, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class Visitor(Base):
    __tablename__ = "visitors"

    id = Column(String, primary_key=True, index=True)
    website_id = Column(String, ForeignKey("websites.id"), nullable=False)
    email = Column(String, nullable=True)
    name = Column(String, nullable=True)
    avatar = Column(String, nullable=True)
    is_identified = Column(Boolean, default=False)
    custom_data = Column(JSON, nullable=True)
    last_seen_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    website = relationship("Website", back_populates="visitors")
    sessions = relationship("VisitorSession", back_populates="visitor")
    conversations = relationship("Conversation", back_populates="visitor")

class VisitorSession(Base):
    __tablename__ = "visitor_sessions"

    id = Column(String, primary_key=True, index=True)
    visitor_id = Column(String, ForeignKey("visitors.id"), nullable=False)
    website_id = Column(String, ForeignKey("websites.id"), nullable=False)
    ip_address = Column(String, nullable=False)
    user_agent = Column(String, nullable=False)
    referrer = Column(String, nullable=True)
    country = Column(String, nullable=True)
    city = Column(String, nullable=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    visitor = relationship("Visitor", back_populates="sessions")
    page_views = relationship("PageView", back_populates="session")

class PageView(Base):
    __tablename__ = "page_views"

    id = Column(String, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("visitor_sessions.id"), nullable=False)
    url = Column(String, nullable=False)
    title = Column(String, nullable=False)
    time_on_page = Column(Integer, nullable=True)  # seconds
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    session = relationship("VisitorSession", back_populates="page_views")