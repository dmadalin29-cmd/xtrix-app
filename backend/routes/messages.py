from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File
from middleware.auth import get_current_user
from datetime import datetime
import uuid
import os
import aiofiles
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/messages", tags=["messages"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")

db = None

def set_db(database):
    global db
    db = database


def user_doc_to_dict(doc):
    if not doc:
        return {}
    return {
        "id": doc.get("_id", ""),
        "username": doc.get("username", ""),
        "displayName": doc.get("displayName", ""),
        "avatar": doc.get("avatar", ""),
        "verified": doc.get("verified", False),
    }


def time_ago(iso_str: str) -> str:
    try:
        dt = datetime.fromisoformat(iso_str)
        diff = datetime.utcnow() - dt
        seconds = int(diff.total_seconds())
        if seconds < 60:
            return "now"
        minutes = seconds // 60
        if minutes < 60:
            return f"{minutes}m"
        hours = minutes // 60
        if hours < 24:
            return f"{hours}h"
        days = hours // 24
        return f"{days}d"
    except Exception:
        return ""


@router.get("/conversations")
async def get_conversations(user_id: str = Depends(get_current_user)):
    """Get all conversations for the current user"""
    convos = await db.conversations.find({
        "participants": user_id
    }).sort("updatedAt", -1).to_list(50)

    result = []
    for convo in convos:
        # Get the other participant
        other_id = [p for p in convo["participants"] if p != user_id]
        other_user = None
        if other_id:
            other_user = await db.users.find_one({"_id": other_id[0]})

        # Get unread count
        unread = await db.messages.count_documents({
            "conversationId": convo["_id"],
            "senderId": {"$ne": user_id},
            "read": False
        })

        result.append({
            "id": convo["_id"],
            "user": user_doc_to_dict(other_user),
            "lastMessage": convo.get("lastMessage", ""),
            "lastMessageTime": time_ago(convo.get("updatedAt", "")),
            "unread": unread,
        })

    return result


@router.post("/conversations")
async def create_or_get_conversation(
    target_user_id: str = Query(...),
    user_id: str = Depends(get_current_user)
):
    """Create or get existing conversation with a user"""
    if target_user_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot message yourself")

    # Check if conversation already exists
    existing = await db.conversations.find_one({
        "participants": {"$all": [user_id, target_user_id]}
    })

    if existing:
        other_user = await db.users.find_one({"_id": target_user_id})
        return {
            "id": existing["_id"],
            "user": user_doc_to_dict(other_user),
            "lastMessage": existing.get("lastMessage", ""),
            "lastMessageTime": time_ago(existing.get("updatedAt", "")),
            "unread": 0,
        }

    # Check target user exists
    target = await db.users.find_one({"_id": target_user_id})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    convo_id = str(uuid.uuid4())
    convo_doc = {
        "_id": convo_id,
        "participants": [user_id, target_user_id],
        "lastMessage": "",
        "createdAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat(),
    }
    await db.conversations.insert_one(convo_doc)

    return {
        "id": convo_id,
        "user": user_doc_to_dict(target),
        "lastMessage": "",
        "lastMessageTime": "now",
        "unread": 0,
    }


@router.get("/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(30, le=50),
    user_id: str = Depends(get_current_user)
):
    """Get messages in a conversation"""
    # Verify user is participant
    convo = await db.conversations.find_one({"_id": conversation_id})
    if not convo or user_id not in convo.get("participants", []):
        raise HTTPException(status_code=403, detail="Not authorized")

    skip = (page - 1) * limit
    total = await db.messages.count_documents({"conversationId": conversation_id})
    messages = await db.messages.find(
        {"conversationId": conversation_id}
    ).sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)

    # Mark messages as read
    await db.messages.update_many(
        {"conversationId": conversation_id, "senderId": {"$ne": user_id}, "read": False},
        {"$set": {"read": True}}
    )

    result = []
    for msg in reversed(messages):
        sender = await db.users.find_one({"_id": msg["senderId"]})
        result.append({
            "id": msg["_id"],
            "sender": user_doc_to_dict(sender),
            "text": msg.get("text", ""),
            "time": time_ago(msg.get("createdAt", "")),
            "isOwn": msg["senderId"] == user_id,
            "read": msg.get("read", False),
        })

    return {"messages": result, "total": total, "hasMore": total > skip + limit}


@router.post("/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: str,
    text: str = Query(...),
    user_id: str = Depends(get_current_user)
):
    """Send a message in a conversation"""
    convo = await db.conversations.find_one({"_id": conversation_id})
    if not convo or user_id not in convo.get("participants", []):
        raise HTTPException(status_code=403, detail="Not authorized")

    msg_id = str(uuid.uuid4())
    msg_doc = {
        "_id": msg_id,
        "conversationId": conversation_id,
        "senderId": user_id,
        "text": text,
        "read": False,
        "createdAt": datetime.utcnow().isoformat(),
    }
    await db.messages.insert_one(msg_doc)

    # Update conversation
    await db.conversations.update_one(
        {"_id": conversation_id},
        {"$set": {"lastMessage": text[:100], "updatedAt": datetime.utcnow().isoformat()}}
    )

    # Create notification for other participant
    other_id = [p for p in convo["participants"] if p != user_id]
    if other_id:
        sender = await db.users.find_one({"_id": user_id})
        await db.notifications.insert_one({
            "_id": str(uuid.uuid4()),
            "userId": other_id[0],
            "fromUserId": user_id,
            "type": "message",
            "text": f"sent you a message",
            "read": False,
            "createdAt": datetime.utcnow().isoformat(),
        })

    sender = await db.users.find_one({"_id": user_id})
    return {
        "id": msg_id,
        "sender": user_doc_to_dict(sender),
        "text": text,
        "time": "now",
        "isOwn": True,
        "read": False,
    }
