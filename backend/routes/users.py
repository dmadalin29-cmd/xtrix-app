from fastapi import APIRouter, HTTPException, Depends, Query
from models.schemas import UserResponse, UserUpdate, FollowResponse
from middleware.auth import get_current_user, get_optional_user
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/users", tags=["users"])

db = None

def set_db(database):
    global db
    db = database


def user_doc_to_response(doc: dict) -> UserResponse:
    return UserResponse(
        id=doc.get("_id", ""),
        username=doc.get("username", ""),
        email=doc.get("email", ""),
        displayName=doc.get("displayName", ""),
        avatar=doc.get("avatar", ""),
        bio=doc.get("bio", ""),
        followers=doc.get("followers", 0),
        following=doc.get("following", 0),
        likes=doc.get("likes", 0),
        verified=doc.get("verified", False),
        createdAt=doc.get("createdAt", ""),
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user_doc_to_response(user)


@router.get("/username/{username}")
async def get_user_by_username(username: str):
    user = await db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Get user's videos
    videos = await db.videos.find({"userId": user["_id"], "visibility": "public"}).sort("createdAt", -1).to_list(50)
    video_list = []
    for v in videos:
        v_user = user_doc_to_response(user)
        video_list.append({
            "id": v["_id"],
            "user": v_user.dict(),
            "description": v.get("caption", ""),
            "music": v.get("music", "Original Sound"),
            "likes": v.get("likes", 0),
            "comments": v.get("commentCount", 0),
            "shares": v.get("shares", 0),
            "bookmarks": v.get("bookmarks", 0),
            "views": v.get("views", 0),
            "videoUrl": v.get("videoUrl", ""),
            "thumbnail": v.get("thumbnail", ""),
            "hashtags": v.get("hashtags", []),
            "createdAt": v.get("createdAt", ""),
        })
    return {"user": user_doc_to_response(user).dict(), "videos": video_list}


@router.put("/me", response_model=UserResponse)
async def update_profile(data: UserUpdate, user_id: str = Depends(get_current_user)):
    update_fields = {k: v for k, v in data.dict().items() if v is not None}
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    await db.users.update_one({"_id": user_id}, {"$set": update_fields})
    user = await db.users.find_one({"_id": user_id})
    return user_doc_to_response(user)


@router.post("/{target_id}/follow", response_model=FollowResponse)
async def toggle_follow(target_id: str, user_id: str = Depends(get_current_user)):
    if target_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    existing = await db.follows.find_one({"followerId": user_id, "followingId": target_id})
    if existing:
        await db.follows.delete_one({"_id": existing["_id"]})
        await db.users.update_one({"_id": target_id}, {"$inc": {"followers": -1}})
        await db.users.update_one({"_id": user_id}, {"$inc": {"following": -1}})
        return FollowResponse(followed=False)
    else:
        import uuid
        await db.follows.insert_one({
            "_id": str(uuid.uuid4()),
            "followerId": user_id,
            "followingId": target_id,
            "createdAt": datetime.utcnow().isoformat()
        })
        await db.users.update_one({"_id": target_id}, {"$inc": {"followers": 1}})
        await db.users.update_one({"_id": user_id}, {"$inc": {"following": 1}})
        # Create notification
        import uuid as uuid_mod
        follower = await db.users.find_one({"_id": user_id})
        await db.notifications.insert_one({
            "_id": str(uuid_mod.uuid4()),
            "userId": target_id,
            "fromUserId": user_id,
            "type": "follow",
            "text": "started following you",
            "read": False,
            "createdAt": datetime.utcnow().isoformat()
        })
        return FollowResponse(followed=True)


@router.get("/{user_id}/followers")
async def get_followers(user_id: str, page: int = Query(1, ge=1), limit: int = Query(20, le=50)):
    skip = (page - 1) * limit
    follows = await db.follows.find({"followingId": user_id}).skip(skip).limit(limit).to_list(limit)
    user_ids = [f["followerId"] for f in follows]
    users = await db.users.find({"_id": {"$in": user_ids}}).to_list(limit)
    return [user_doc_to_response(u).dict() for u in users]


@router.get("/{user_id}/following")
async def get_following(user_id: str, page: int = Query(1, ge=1), limit: int = Query(20, le=50)):
    skip = (page - 1) * limit
    follows = await db.follows.find({"followerId": user_id}).skip(skip).limit(limit).to_list(limit)
    user_ids = [f["followingId"] for f in follows]
    users = await db.users.find({"_id": {"$in": user_ids}}).to_list(limit)
    return [user_doc_to_response(u).dict() for u in users]
