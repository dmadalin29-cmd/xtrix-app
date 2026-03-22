#!/usr/bin/env python3
"""
Admin Setup Script for Xtrix
- Clean all fake/test data
- Create admin user d.madalin29@gmail.com
- Setup admin panel routes
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from uuid import uuid4
from datetime import datetime, timezone
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def setup_admin():
    # Load env
    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.environ.get("DB_NAME", "xtrix_production")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("🗑️  STEP 1: Cleaning fake data...")
    
    # Delete all test/fake users (keep only real admin)
    deleted_users = await db.users.delete_many({})
    print(f"   ✅ Deleted {deleted_users.deleted_count} users")
    
    # Delete all fake videos
    deleted_videos = await db.videos.delete_many({})
    print(f"   ✅ Deleted {deleted_videos.deleted_count} videos")
    
    # Delete all fake streams
    deleted_streams = await db.livestreams.delete_many({})
    print(f"   ✅ Deleted {deleted_streams.deleted_count} streams")
    
    # Delete all comments
    deleted_comments = await db.comments.delete_many({})
    print(f"   ✅ Deleted {deleted_comments.deleted_count} comments")
    
    # Delete all likes/bookmarks/follows
    await db.likes.delete_many({})
    await db.bookmarks.delete_many({})
    await db.follows.delete_many({})
    await db.notifications.delete_many({})
    await db.messages.delete_many({})
    await db.conversations.delete_many({})
    await db.live_chat.delete_many({})
    await db.comment_replies.delete_many({})
    print(f"   ✅ Cleaned all interactions")
    
    print("\n👑 STEP 2: Creating admin user...")
    
    # Create admin user
    admin_id = str(uuid4())
    admin_password = bcrypt.hashpw("Admin2025!".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    admin_user = {
        "_id": admin_id,  # Use _id as primary key (same as other users)
        "username": "admin_xtrix",
        "email": "d.madalin29@gmail.com",
        "displayName": "Xtrix Admin",
        "password": admin_password,
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=admin_xtrix",
        "bio": "Xtrix Platform Administrator 👑",
        "followers": 0,
        "following": 0,
        "likes": 0,
        "verified": True,
        "isAdmin": True,  # ADMIN FLAG
        "walletBalance": 10000,  # Bonus pentru admin
        "totalEarned": 0,
        "totalSpent": 0,
        "totalGiftsReceived": 0,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    
    await db.users.insert_one(admin_user)
    print(f"   ✅ Admin created: {admin_user['email']}")
    print(f"   📧 Email: d.madalin29@gmail.com")
    print(f"   🔑 Password: Admin2025!")
    print(f"   👑 isAdmin: True")
    print(f"   💰 Wallet: 10,000 coins")
    
    print("\n✅ SETUP COMPLETE!")
    print("\n🔐 Login credentials:")
    print("   Email: d.madalin29@gmail.com")
    print("   Password: Admin2025!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(setup_admin())
