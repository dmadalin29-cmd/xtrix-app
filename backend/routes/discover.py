from fastapi import APIRouter, Depends, Query
from middleware.auth import get_optional_user, get_current_user
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["discover"])

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
        return f"{days}d ago"
    except Exception:
        return "recently"


@router.get("/discover/trending")
async def get_trending():
    # Get trending hashtags
    hashtags = await db.hashtags.find().sort("count", -1).limit(12).to_list(12)
    icon_map = {
        'fyp': 'flame', 'viral': 'zap', 'dance': 'music', 'comedy': 'smile',
        'cooking': 'chef-hat', 'fitness': 'dumbbell', 'travel': 'plane',
        'tech': 'cpu', 'art': 'palette', 'music': 'headphones',
        'fashion': 'shirt', 'food': 'chef-hat'
    }
    hashtag_list = []
    for h in hashtags:
        tag = h.get("tag", "")
        count = h.get("count", 0)
        # Format count
        if count >= 1_000_000_000:
            count_str = f"{count / 1_000_000_000:.1f}B"
        elif count >= 1_000_000:
            count_str = f"{count / 1_000_000:.1f}M"
        elif count >= 1_000:
            count_str = f"{count / 1_000:.1f}K"
        else:
            count_str = str(count)
        hashtag_list.append({
            "tag": tag,
            "posts": count_str,
            "icon": icon_map.get(tag, "hash")
        })

    # Get trending videos with smart algorithm
    # Score = (engagement × 0.5) + (popularity × 0.3) + (recency × 0.2)
    pipeline = [
        {"$match": {"visibility": "public"}},
        {"$addFields": {
            "engagementRate": {
                "$cond": [
                    {"$gt": ["$views", 0]},
                    {"$divide": [
                        {"$add": [
                            "$likes",
                            {"$multiply": ["$commentCount", 2]},
                            {"$multiply": ["$shares", 3]}
                        ]},
                        "$views"
                    ]},
                    0
                ]
            },
            "popularityScore": {
                "$add": [
                    {"$multiply": ["$views", 0.001]},
                    {"$multiply": ["$likes", 0.15]}
                ]
            },
            "recencyScore": {
                "$divide": [
                    {"$subtract": [
                        {"$toLong": "$$NOW"},
                        {"$toLong": {"$dateFromString": {"dateString": "$createdAt"}}}
                    ]},
                    86400000
                ]
            }
        }},
        {"$addFields": {
            "recencyBoost": {
                "$cond": [
                    {"$lte": ["$recencyScore", 7]},
                    {"$subtract": [7, "$recencyScore"]},
                    0
                ]
            }
        }},
        {"$addFields": {
            "trendingScore": {
                "$add": [
                    {"$multiply": ["$engagementRate", 50]},
                    {"$multiply": ["$popularityScore", 0.3]},
                    {"$multiply": ["$recencyBoost", 0.2]}
                ]
            }
        }},
        {"$sort": {"trendingScore": -1}},
        {"$limit": 12}
    ]
    
    trending_videos = await db.videos.aggregate(pipeline).to_list(12)
    videos = []
    for doc in trending_videos:
        user = await db.users.find_one({"_id": doc.get("userId", "")})
        videos.append({
            "id": doc["_id"],
            "user": user_doc_to_response(user).dict() if user else {},
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
            "createdAt": time_ago(doc.get("createdAt", "")),
        })

    return {"hashtags": hashtag_list, "videos": videos}


@router.get("/discover/creators")
async def get_creators(limit: int = Query(10, le=30)):
    creators = await db.users.find().sort("followers", -1).limit(limit).to_list(limit)
    return [user_doc_to_response(c).dict() for c in creators]


@router.get("/hashtag/{tag}")
async def get_hashtag_videos(tag: str, page: int = Query(1, ge=1), limit: int = Query(20, le=50)):
    """Get videos by hashtag"""
    skip = (page - 1) * limit
    total = await db.videos.count_documents({"hashtags": tag, "visibility": "public"})
    docs = await db.videos.find({"hashtags": tag, "visibility": "public"}).sort("likes", -1).skip(skip).limit(limit).to_list(limit)
    videos = []
    for doc in docs:
        user = await db.users.find_one({"_id": doc.get("userId", "")})
        videos.append({
            "id": doc["_id"],
            "user": user_doc_to_response(user).dict() if user else {},
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
            "createdAt": time_ago(doc.get("createdAt", "")),
        })
    # Get hashtag info
    hashtag_doc = await db.hashtags.find_one({"tag": tag})
    count = hashtag_doc.get("count", 0) if hashtag_doc else total
    return {"tag": tag, "postCount": count, "videos": videos, "total": total, "hasMore": total > skip + limit}


@router.get("/analytics")
async def get_analytics(user_id: str = Depends(get_current_user)):
    """Get creator analytics dashboard data"""
    user = await db.users.find_one({"_id": user_id})
    if not user:
        return {}

    # Total videos
    total_videos = await db.videos.count_documents({"userId": user_id})

    # Total views across all videos
    pipeline = [
        {"$match": {"userId": user_id}},
        {"$group": {"_id": None, "totalViews": {"$sum": "$views"}, "totalLikes": {"$sum": "$likes"}, "totalComments": {"$sum": "$commentCount"}, "totalShares": {"$sum": "$shares"}}}
    ]
    stats = await db.videos.aggregate(pipeline).to_list(1)
    agg = stats[0] if stats else {"totalViews": 0, "totalLikes": 0, "totalComments": 0, "totalShares": 0}

    # Top videos
    top_videos = await db.videos.find({"userId": user_id}).sort("views", -1).limit(5).to_list(5)
    top_list = []
    for v in top_videos:
        top_list.append({
            "id": v["_id"],
            "caption": v.get("caption", "")[:60],
            "views": v.get("views", 0),
            "likes": v.get("likes", 0),
            "comments": v.get("commentCount", 0),
            "thumbnail": v.get("thumbnail", ""),
        })

    # Recent followers
    recent_follows = await db.follows.find({"followingId": user_id}).sort("createdAt", -1).limit(5).to_list(5)
    recent_followers = []
    for f in recent_follows:
        fu = await db.users.find_one({"_id": f["followerId"]})
        if fu:
            recent_followers.append(user_doc_to_response(fu).dict())

    return {
        "totalVideos": total_videos,
        "totalViews": agg.get("totalViews", 0),
        "totalLikes": agg.get("totalLikes", 0),
        "totalComments": agg.get("totalComments", 0),
        "totalShares": agg.get("totalShares", 0),
        "followers": user.get("followers", 0),
        "following": user.get("following", 0),
        "topVideos": top_list,
        "recentFollowers": recent_followers,
    }


@router.get("/search")
async def search(q: str = Query("", min_length=1), type: str = Query("all")):
    results = {"users": [], "videos": []}
    if type in ("all", "users"):
        users = await db.users.find({
            "$or": [
                {"username": {"$regex": q, "$options": "i"}},
                {"displayName": {"$regex": q, "$options": "i"}}
            ]
        }).limit(20).to_list(20)
        results["users"] = [user_doc_to_response(u).dict() for u in users]

    if type in ("all", "videos"):
        vids = await db.videos.find({
            "$or": [
                {"caption": {"$regex": q, "$options": "i"}},
                {"hashtags": {"$regex": q, "$options": "i"}}
            ],
            "visibility": "public"
        }).sort("createdAt", -1).limit(20).to_list(20)
        for doc in vids:
            user = await db.users.find_one({"_id": doc.get("userId", "")})
            results["videos"].append({
                "id": doc["_id"],
                "user": user_doc_to_response(user).dict() if user else {},
                "description": doc.get("caption", ""),
                "likes": doc.get("likes", 0),
                "comments": doc.get("commentCount", 0),
                "views": doc.get("views", 0),
                "videoUrl": doc.get("videoUrl", ""),
                "thumbnail": doc.get("thumbnail", ""),
                "hashtags": doc.get("hashtags", []),
                "createdAt": time_ago(doc.get("createdAt", "")),
            })
    return results


@router.get("/notifications")
async def get_notifications(user_id: str = Depends(get_current_user)):
    docs = await db.notifications.find({"userId": user_id}).sort("createdAt", -1).limit(30).to_list(30)
    notifications = []
    for doc in docs:
        from_user = await db.users.find_one({"_id": doc.get("fromUserId", "")})
        notifications.append({
            "id": doc["_id"],
            "type": doc.get("type", ""),
            "user": user_doc_to_response(from_user).dict() if from_user else {},
            "text": doc.get("text", ""),
            "time": time_ago(doc.get("createdAt", "")),
        })
    return notifications
