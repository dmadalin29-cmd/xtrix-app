from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Query
from models.schemas import VideoResponse, LikeResponse, BookmarkResponse, CommentCreate, CommentResponse
from middleware.auth import get_current_user, get_optional_user
from datetime import datetime
import uuid
import os
import logging
import aiofiles

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/videos", tags=["videos"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

db = None

def set_db(database):
    global db
    db = database


def user_doc_to_response(doc):
    from models.schemas import UserResponse
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


def time_ago(iso_str: str) -> str:
    try:
        dt = datetime.fromisoformat(iso_str)
        diff = datetime.utcnow() - dt
        seconds = int(diff.total_seconds())
        if seconds < 60:
            return f"{seconds}s ago"
        minutes = seconds // 60
        if minutes < 60:
            return f"{minutes}m ago"
        hours = minutes // 60
        if hours < 24:
            return f"{hours}h ago"
        days = hours // 24
        if days < 30:
            return f"{days}d ago"
        months = days // 30
        return f"{months}mo ago"
    except Exception:
        return "recently"


async def video_doc_to_response(doc: dict) -> dict:
    user = await db.users.find_one({"_id": doc.get("userId", "")})
    user_resp = user_doc_to_response(user) if user else None
    return {
        "id": doc["_id"],
        "user": user_resp.dict() if user_resp else {},
        "description": doc.get("caption", ""),
        "music": doc.get("music", "Original Sound"),
        "likes": doc.get("likes", 0),
        "comments": doc.get("commentCount", 0),
        "shares": doc.get("shares", 0),
        "bookmarks": doc.get("bookmarks", 0),
        "views": doc.get("views", 0),
        "videoUrl": doc.get("videoUrl", ""),
        "thumbnail": doc.get("thumbnail", ""),
        "hashtags": doc.get("hashtags", []),
        "visibility": doc.get("visibility", "public"),
        "allowComments": doc.get("allowComments", True),
        "createdAt": time_ago(doc.get("createdAt", "")),
    }


@router.get("/feed")
async def get_feed(page: int = Query(1, ge=1), limit: int = Query(10, le=30), user_id: str = Depends(get_optional_user)):
    skip = (page - 1) * limit
    cursor = db.videos.find({"visibility": "public"}).sort("createdAt", -1).skip(skip).limit(limit + 1)
    docs = await cursor.to_list(limit + 1)
    has_more = len(docs) > limit
    docs = docs[:limit]
    videos = []
    for doc in docs:
        v = await video_doc_to_response(doc)
        # Check if current user liked/bookmarked
        if user_id:
            liked = await db.likes.find_one({"userId": user_id, "videoId": doc["_id"]})
            bookmarked = await db.bookmarks.find_one({"userId": user_id, "videoId": doc["_id"]})
            v["isLiked"] = liked is not None
            v["isBookmarked"] = bookmarked is not None
        videos.append(v)
    return {"videos": videos, "hasMore": has_more}


@router.get("/following")
async def get_following_feed(page: int = Query(1, ge=1), limit: int = Query(10, le=30), user_id: str = Depends(get_current_user)):
    follows = await db.follows.find({"followerId": user_id}).to_list(500)
    following_ids = [f["followingId"] for f in follows]
    if not following_ids:
        return {"videos": [], "hasMore": False}
    skip = (page - 1) * limit
    cursor = db.videos.find({"userId": {"$in": following_ids}, "visibility": "public"}).sort("createdAt", -1).skip(skip).limit(limit + 1)
    docs = await cursor.to_list(limit + 1)
    has_more = len(docs) > limit
    docs = docs[:limit]
    videos = []
    for doc in docs:
        v = await video_doc_to_response(doc)
        liked = await db.likes.find_one({"userId": user_id, "videoId": doc["_id"]})
        bookmarked = await db.bookmarks.find_one({"userId": user_id, "videoId": doc["_id"]})
        v["isLiked"] = liked is not None
        v["isBookmarked"] = bookmarked is not None
        videos.append(v)
    return {"videos": videos, "hasMore": has_more}


@router.post("")
async def create_video(
    caption: str = Form(""),
    hashtags: str = Form(""),
    visibility: str = Form("public"),
    allowComments: bool = Form(True),
    allowDuet: bool = Form(True),
    allowStitch: bool = Form(True),
    videoUrl: str = Form(""),
    file: UploadFile = File(None),
    user_id: str = Depends(get_current_user)
):
    video_id = str(uuid.uuid4())
    final_url = videoUrl
    thumbnail = ""

    # Handle file upload
    if file and file.filename:
        ext = os.path.splitext(file.filename)[1]
        filename = f"{video_id}{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        async with aiofiles.open(filepath, 'wb') as f:
            content = await file.read()
            await f.write(content)
        final_url = f"/api/uploads/{filename}"

    # Parse hashtags
    tags = [t.strip().lstrip('#') for t in hashtags.split(',') if t.strip()] if hashtags else []
    if not tags and caption:
        import re
        tags = re.findall(r'#(\w+)', caption)

    video_doc = {
        "_id": video_id,
        "userId": user_id,
        "caption": caption,
        "hashtags": tags,
        "music": "Original Sound",
        "videoUrl": final_url,
        "thumbnail": thumbnail,
        "visibility": visibility,
        "allowComments": allowComments,
        "allowDuet": allowDuet,
        "allowStitch": allowStitch,
        "likes": 0,
        "commentCount": 0,
        "shares": 0,
        "bookmarks": 0,
        "views": 0,
        "createdAt": datetime.utcnow().isoformat(),
    }
    await db.videos.insert_one(video_doc)

    # Update hashtag counts
    for tag in tags:
        await db.hashtags.update_one(
            {"tag": tag},
            {"$inc": {"count": 1}, "$setOnInsert": {"_id": str(uuid.uuid4()), "tag": tag}},
            upsert=True
        )

    result = await video_doc_to_response(video_doc)
    return result


@router.get("/{video_id}")
async def get_video(video_id: str, user_id: str = Depends(get_optional_user)):
    doc = await db.videos.find_one({"_id": video_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Video not found")
    v = await video_doc_to_response(doc)
    if user_id:
        liked = await db.likes.find_one({"userId": user_id, "videoId": video_id})
        bookmarked = await db.bookmarks.find_one({"userId": user_id, "videoId": video_id})
        v["isLiked"] = liked is not None
        v["isBookmarked"] = bookmarked is not None
    return v


@router.delete("/{video_id}")
async def delete_video(video_id: str, user_id: str = Depends(get_current_user)):
    doc = await db.videos.find_one({"_id": video_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Video not found")
    if doc["userId"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.videos.delete_one({"_id": video_id})
    await db.comments.delete_many({"videoId": video_id})
    await db.likes.delete_many({"videoId": video_id})
    await db.bookmarks.delete_many({"videoId": video_id})
    return {"success": True}


@router.post("/{video_id}/like")
async def toggle_like(video_id: str, user_id: str = Depends(get_current_user)):
    existing = await db.likes.find_one({"userId": user_id, "videoId": video_id})
    if existing:
        await db.likes.delete_one({"_id": existing["_id"]})
        await db.videos.update_one({"_id": video_id}, {"$inc": {"likes": -1}})
        video = await db.videos.find_one({"_id": video_id})
        # Decrement creator's total likes
        if video:
            await db.users.update_one({"_id": video["userId"]}, {"$inc": {"likes": -1}})
        return {"liked": False, "likeCount": max(0, video.get("likes", 0)) if video else 0}
    else:
        await db.likes.insert_one({
            "_id": str(uuid.uuid4()),
            "userId": user_id,
            "videoId": video_id,
            "createdAt": datetime.utcnow().isoformat()
        })
        await db.videos.update_one({"_id": video_id}, {"$inc": {"likes": 1}})
        video = await db.videos.find_one({"_id": video_id})
        if video:
            await db.users.update_one({"_id": video["userId"]}, {"$inc": {"likes": 1}})
            # Notification
            if video["userId"] != user_id:
                await db.notifications.insert_one({
                    "_id": str(uuid.uuid4()),
                    "userId": video["userId"],
                    "fromUserId": user_id,
                    "type": "like",
                    "text": "liked your video",
                    "videoId": video_id,
                    "read": False,
                    "createdAt": datetime.utcnow().isoformat()
                })
        return {"liked": True, "likeCount": video.get("likes", 0) if video else 0}


@router.post("/{video_id}/bookmark")
async def toggle_bookmark(video_id: str, user_id: str = Depends(get_current_user)):
    existing = await db.bookmarks.find_one({"userId": user_id, "videoId": video_id})
    if existing:
        await db.bookmarks.delete_one({"_id": existing["_id"]})
        await db.videos.update_one({"_id": video_id}, {"$inc": {"bookmarks": -1}})
        return {"bookmarked": False}
    else:
        await db.bookmarks.insert_one({
            "_id": str(uuid.uuid4()),
            "userId": user_id,
            "videoId": video_id,
            "createdAt": datetime.utcnow().isoformat()
        })
        await db.videos.update_one({"_id": video_id}, {"$inc": {"bookmarks": 1}})
        return {"bookmarked": True}


@router.post("/{video_id}/view")
async def record_view(video_id: str):
    await db.videos.update_one({"_id": video_id}, {"$inc": {"views": 1}})
    return {"success": True}


# ---- Comments ----
@router.get("/{video_id}/comments")
async def get_comments(video_id: str, page: int = Query(1, ge=1), limit: int = Query(20, le=50)):
    skip = (page - 1) * limit
    total = await db.comments.count_documents({"videoId": video_id})
    docs = await db.comments.find({"videoId": video_id}).sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)
    comments = []
    for doc in docs:
        user = await db.users.find_one({"_id": doc["userId"]})
        comments.append({
            "id": doc["_id"],
            "user": user_doc_to_response(user).dict() if user else {},
            "text": doc.get("text", ""),
            "likes": doc.get("likes", 0),
            "time": time_ago(doc.get("createdAt", "")),
            "replies": doc.get("replies", 0),
        })
    return {"comments": comments, "total": total}


@router.post("/{video_id}/comments")
async def create_comment(video_id: str, data: CommentCreate, user_id: str = Depends(get_current_user)):
    video = await db.videos.find_one({"_id": video_id})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    comment_id = str(uuid.uuid4())
    comment_doc = {
        "_id": comment_id,
        "videoId": video_id,
        "userId": user_id,
        "text": data.text,
        "likes": 0,
        "replies": 0,
        "createdAt": datetime.utcnow().isoformat(),
    }
    await db.comments.insert_one(comment_doc)
    await db.videos.update_one({"_id": video_id}, {"$inc": {"commentCount": 1}})

    # Notification
    if video["userId"] != user_id:
        user = await db.users.find_one({"_id": user_id})
        await db.notifications.insert_one({
            "_id": str(uuid.uuid4()),
            "userId": video["userId"],
            "fromUserId": user_id,
            "type": "comment",
            "text": f'commented: {data.text[:50]}',
            "videoId": video_id,
            "read": False,
            "createdAt": datetime.utcnow().isoformat()
        })

    user = await db.users.find_one({"_id": user_id})
    return {
        "id": comment_id,
        "user": user_doc_to_response(user).dict() if user else {},
        "text": data.text,
        "likes": 0,
        "time": "now",
        "replies": 0,
    }
