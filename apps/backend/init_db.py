#!/usr/bin/env python3
"""
Initialize database tables and create sample data
"""

from app.db.database import engine, Base
from app.models.user import User, UserRole, UserStatus
from app.models.website import Website
from app.models.conversation import Conversation, Message
from app.models.visitor import Visitor
from app.core.security import get_password_hash
from sqlalchemy.orm import sessionmaker
import uuid
from datetime import datetime

def init_database():
    """Create all tables and add sample data"""
    
    # Create all tables
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created")
    
    # Create a session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Check if admin user already exists
        existing_admin = db.query(User).filter(User.email == "admin@example.com").first()
        if existing_admin:
            print("✅ Admin user already exists")
        else:
            # Create admin user
            admin_user = User(
                id=str(uuid.uuid4()),
                email="admin@example.com",
                hashed_password=get_password_hash("admin123"),
                name="Admin User",
                role=UserRole.ADMIN,
                status=UserStatus.ACTIVE
            )
            db.add(admin_user)
            print("✅ Created admin user (admin@example.com / admin123)")
        
        # Check if test website already exists
        existing_website = db.query(Website).filter(Website.domain == "store.example.com").first()
        if existing_website:
            print("✅ Test website already exists")
        else:
            # Create test website
            test_website = Website(
                id="test-website-123",
                name="TechStore Demo",
                domain="store.example.com",
                widget_config={
                    "primaryColor": "#667eea",
                    "position": "bottom-right",
                    "welcomeMessage": "Hi! Welcome to TechStore. How can I help you today?",
                    "agentName": "TechStore Support",
                    "enableFileUpload": True,
                    "enableEmoji": True
                },
                is_active=True
            )
            db.add(test_website)
            print("✅ Created test website (test-website-123)")
        
        # Create sample visitor if not exists
        existing_visitor = db.query(Visitor).filter(Visitor.id == "visitor-sample-123").first()
        if not existing_visitor:
            sample_visitor = Visitor(
                id="visitor-sample-123",
                website_id="test-website-123",
                name="John Doe",
                email="john@example.com",
                is_identified=True,
                custom_data={
                    "location": "New York, NY",
                    "phone": "+1 (555) 123-4567"
                }
            )
            db.add(sample_visitor)
            print("✅ Created sample visitor")
        
        db.commit()
        print("\n🎉 Database initialization complete!")
        print("\n📋 Test credentials:")
        print("   Admin Email: admin@example.com")
        print("   Admin Password: admin123")
        print("   Website ID: test-website-123")
        print("\n🚀 You can now start the servers:")
        print("   Backend: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
        print("   Admin: cd ../admin-web && npm run dev")
        print("   Test Site: cd ../../test-website && python3 server.py")
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_database()