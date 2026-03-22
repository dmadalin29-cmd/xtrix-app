from fastapi import APIRouter, Depends, HTTPException, Query, Header
from middleware.auth import get_current_user
from typing import Optional
from datetime import datetime, timezone
from uuid import uuid4
import bcrypt
import jwt
import os

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Will be set from server.py
db = None

def set_db(database):
    global db
    db = database


async def get_admin_user(authorization: str = Header(None)):
    """Verify admin user from JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    try:
        jwt_secret = os.environ.get("JWT_SECRET", "secret")
        payload = jwt.decode(token, jwt_secret, algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Check if user is admin
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user or not user.get("isAdmin", False):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        return user_id
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/setup-admin")
async def setup_admin():
    """One-time admin setup - creates admin account"""
    # Check if admin already exists
    existing = await db.users.find_one({"email": "d.madalin29@gmail.com"}, {"_id": 0})
    
    if existing:
        # Update to admin
        hashed_password = bcrypt.hashpw("Admin2025!".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        await db.users.update_one(
            {"email": "d.madalin29@gmail.com"},
            {"$set": {
                "isAdmin": True,
                "verified": True,
                "password": hashed_password,
                "walletBalance": 10000
            }}
        )
        return {"success": True, "message": "Admin privileges granted", "email": "d.madalin29@gmail.com"}
    
    # Create new admin
    admin_id = str(uuid4())
    hashed_password = bcrypt.hashpw("Admin2025!".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    admin_user = {
        "id": admin_id,
        "username": "admin_xtrix",
        "email": "d.madalin29@gmail.com",
        "displayName": "Xtrix Admin",
        "password": hashed_password,
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=admin_xtrix",
        "bio": "Xtrix Platform Administrator 👑",
        "followers": 0,
        "following": 0,
        "likes": 0,
        "verified": True,
        "isAdmin": True,
        "walletBalance": 10000,
        "totalEarned": 0,
        "totalSpent": 0,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    
    await db.users.insert_one(admin_user)
    
    return {
        "success": True,
        "message": "Admin account created",
        "email": "d.madalin29@gmail.com",
        "password": "Admin2025!",
        "isAdmin": True
    }


@router.delete("/cleanup-database")
async def cleanup_database(admin_id: str = Depends(get_admin_user)):
    """Delete all fake/test data from database"""
    
    results = {}
    
    # Delete all users except admin
    deleted_users = await db.users.delete_many({"isAdmin": {"$ne": True}})
    results["users_deleted"] = deleted_users.deleted_count
    
    # Delete all content
    deleted_videos = await db.videos.delete_many({})
    results["videos_deleted"] = deleted_videos.deleted_count
    
    deleted_streams = await db.livestreams.delete_many({})
    results["streams_deleted"] = deleted_streams.deleted_count
    
    deleted_comments = await db.comments.delete_many({})
    results["comments_deleted"] = deleted_comments.deleted_count
    
    # Delete all interactions
    await db.likes.delete_many({})
    await db.bookmarks.delete_many({})
    await db.follows.delete_many({})
    await db.notifications.delete_many({})
    await db.messages.delete_many({})
    await db.conversations.delete_many({})
    await db.live_chat.delete_many({})
    await db.comment_replies.delete_many({})
    
    return {"success": True, "results": results}


@router.get("/stats")
async def get_admin_stats(admin_id: str = Depends(get_admin_user)):
    """Get platform statistics"""
    
    total_users = await db.users.count_documents({})
    total_videos = await db.videos.count_documents({})
    total_streams = await db.livestreams.count_documents({"active": True})
    total_comments = await db.comments.count_documents({})
    
    # Get recent users
    recent_users = await db.users.find({}, {"_id": 0}).sort("createdAt", -1).limit(10).to_list(10)
    
    # Get recent videos
    recent_videos = await db.videos.find({}, {"_id": 0, "id": 1, "caption": 1, "views": 1, "likes": 1, "userId": 1, "createdAt": 1}).sort("createdAt", -1).limit(10).to_list(10)
    
    return {
        "stats": {
            "totalUsers": total_users,
            "totalVideos": total_videos,
            "activeStreams": total_streams,
            "totalComments": total_comments,
        },
        "recentUsers": recent_users,
        "recentVideos": recent_videos,
    }


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin_id: str = Depends(get_admin_user)):
    """Delete a user and all their content"""
    
    # Prevent deleting admin
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.get("isAdmin"):
        raise HTTPException(status_code=403, detail="Cannot delete admin user")
    
    # Delete user's content
    await db.videos.delete_many({"userId": user_id})
    await db.comments.delete_many({"userId": user_id})
    await db.livestreams.delete_many({"userId": user_id})
    
    # Delete user
    await db.users.delete_one({"id": user_id})
    
    return {"success": True, "message": f"User {user_id} deleted"}


@router.delete("/videos/{video_id}")
async def delete_video(video_id: str, admin_id: str = Depends(get_admin_user)):
    """Delete a video and all related data"""
    
    video = await db.videos.find_one({"id": video_id}, {"_id": 0})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Delete video and related data
    await db.videos.delete_one({"id": video_id})
    await db.comments.delete_many({"videoId": video_id})
    await db.likes.delete_many({"videoId": video_id})
    await db.bookmarks.delete_many({"videoId": video_id})
    
    return {"success": True, "message": f"Video {video_id} deleted"}


@router.get("/users")
async def list_all_users(page: int = Query(1, ge=1), limit: int = Query(20, le=100), admin_id: str = Depends(get_admin_user)):
    """List all users with pagination"""
    
    skip = (page - 1) * limit
    total = await db.users.count_documents({})
    users = await db.users.find({}, {"_id": 0, "password": 0}).sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)
    
    return {"users": users, "total": total, "page": page, "limit": limit}
