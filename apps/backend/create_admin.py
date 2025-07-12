#!/usr/bin/env python3
"""
Script to create an admin user for testing
"""

import sys
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.user import User, UserRole, UserStatus
from app.core.security import get_password_hash
from app.core.config import settings

def create_admin_user():
    # Create database connection
    engine = create_engine(settings.database_url)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.email == "admin@example.com").first()
        if existing_admin:
            print("Admin user already exists!")
            return
        
        # Create admin user
        admin_user = User(
            id=str(uuid.uuid4()),
            email="admin@example.com",
            name="Admin User",
            hashed_password=get_password_hash("password123"),
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE
        )
        
        db.add(admin_user)
        db.commit()
        
        print("Admin user created successfully!")
        print("Email: admin@example.com")
        print("Password: password123")
        
    except Exception as e:
        print(f"Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()