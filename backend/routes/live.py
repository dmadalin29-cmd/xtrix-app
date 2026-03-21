from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File
from fastapi.responses import FileResponse, StreamingResponse
from middleware.auth import get_current_user, get_optional_user
from datetime import datetime, timezone
import uuid
import logging
import os
import subprocess
import aiofiles
from pathlib import Path

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/live", tags=["live"])

# Directories for live streaming
LIVE_STREAMS_DIR = Path("/app/backend/live_streams")
LIVE_HLS_DIR = Path("/app/backend/live_hls")
LIVE_STREAMS_DIR.mkdir(exist_ok=True)
LIVE_HLS_DIR.mkdir(exist_ok=True)

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
        "followers": doc.get("followers", 0),
    }


def time_ago(iso_str: str) -> str:
    try:
        dt = datetime.fromisoformat(iso_str)
        diff = datetime.utcnow() - dt
        seconds = int(diff.total_seconds())
        if seconds < 60:
            return f"{seconds}s"
        minutes = seconds // 60
        if minutes < 60:
            return f"{minutes}m"
        hours = minutes // 60
        return f"{hours}h"
    except Exception:
        return ""


@router.post("/start")
async def start_live(
    title: str = Query(..., min_length=1),
    category: str = Query("other"),
    user_id: str = Depends(get_current_user)
):
    """Start a live stream"""
    # Check if user already has an active stream
    existing = await db.livestreams.find_one({"userId": user_id, "active": True})
    if existing:
        # Return existing stream
        user = await db.users.find_one({"_id": user_id})
        return {
            "id": existing["_id"],
            "user": user_doc_to_dict(user),
            "title": existing.get("title", ""),
            "category": existing.get("category", ""),
            "viewers": existing.get("viewers", 0),
            "likes": existing.get("likes", 0),
            "active": True,
            "startedAt": existing.get("startedAt", ""),
            "hlsUrl": f"/api/live/{existing['_id']}/stream.m3u8"
        }

    stream_id = str(uuid.uuid4())
    
    # Create HLS directory for this stream
    stream_hls_dir = LIVE_HLS_DIR / stream_id
    stream_hls_dir.mkdir(exist_ok=True)
    
    stream_doc = {
        "_id": stream_id,
        "userId": user_id,
        "title": title,
        "category": category,
        "viewers": 0,
        "peakViewers": 0,
        "likes": 0,
        "active": True,
        "startedAt": datetime.now(timezone.utc).isoformat(),
        "hlsPath": str(stream_hls_dir),
    }
    await db.livestreams.insert_one(stream_doc)

    user = await db.users.find_one({"_id": user_id})
    return {
        "id": stream_id,
        "user": user_doc_to_dict(user),
        "title": title,
        "category": category,
        "viewers": 0,
        "likes": 0,
        "active": True,
        "startedAt": stream_doc["startedAt"],
        "hlsUrl": f"/api/live/{stream_id}/stream.m3u8"
    }


@router.post("/{stream_id}/end")
async def end_live(stream_id: str, user_id: str = Depends(get_current_user)):
    """End a live stream"""
    stream = await db.livestreams.find_one({"_id": stream_id})
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")
    if stream["userId"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.livestreams.update_one(
        {"_id": stream_id},
        {"$set": {"active": False, "endedAt": datetime.now(timezone.utc).isoformat()}}
    )

    # Calculate duration
    started = datetime.fromisoformat(stream["startedAt"])
    duration = int((datetime.now(timezone.utc) - started).total_seconds())
    
    # Clean up HLS files (optional - can keep for replay)
    # stream_hls_dir = Path(stream.get("hlsPath", ""))
    # if stream_hls_dir.exists():
    #     shutil.rmtree(stream_hls_dir)

    return {
        "success": True,
        "duration": duration,
        "peakViewers": stream.get("peakViewers", 0),
        "totalLikes": stream.get("likes", 0),
    }


@router.get("/active")
async def get_active_streams():
    """Get all active live streams"""
    streams = await db.livestreams.find({"active": True}).sort("viewers", -1).to_list(50)
    result = []
    for s in streams:
        user = await db.users.find_one({"_id": s["userId"]})
        result.append({
            "id": s["_id"],
            "user": user_doc_to_dict(user),
            "title": s.get("title", ""),
            "category": s.get("category", ""),
            "viewers": s.get("viewers", 0),
            "likes": s.get("likes", 0),
            "active": True,
            "startedAt": s.get("startedAt", ""),
            "duration": time_ago(s.get("startedAt", "")),
        })
    return result


@router.get("/{stream_id}")
async def get_stream(stream_id: str):
    """Get a specific live stream"""
    stream = await db.livestreams.find_one({"_id": stream_id})
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")
    user = await db.users.find_one({"_id": stream["userId"]})
    return {
        "id": stream["_id"],
        "user": user_doc_to_dict(user),
        "title": stream.get("title", ""),
        "category": stream.get("category", ""),
        "viewers": stream.get("viewers", 0),
        "likes": stream.get("likes", 0),
        "active": stream.get("active", False),
        "startedAt": stream.get("startedAt", ""),
    }


@router.post("/{stream_id}/join")
async def join_stream(stream_id: str):
    """Join a live stream (increment viewers)"""
    await db.livestreams.update_one(
        {"_id": stream_id, "active": True},
        {"$inc": {"viewers": 1}}
    )
    # Update peak viewers
    stream = await db.livestreams.find_one({"_id": stream_id})
    if stream and stream.get("viewers", 0) > stream.get("peakViewers", 0):
        await db.livestreams.update_one(
            {"_id": stream_id},
            {"$set": {"peakViewers": stream["viewers"]}}
        )
    return {"success": True}


@router.post("/{stream_id}/leave")
async def leave_stream(stream_id: str):
    """Leave a live stream (decrement viewers)"""
    await db.livestreams.update_one(
        {"_id": stream_id, "active": True},
        {"$inc": {"viewers": -1}}
    )
    return {"success": True}


@router.post("/{stream_id}/like")
async def like_stream(stream_id: str, user_id: str = Depends(get_current_user)):
    """Like/heart a live stream"""
    await db.livestreams.update_one(
        {"_id": stream_id, "active": True},
        {"$inc": {"likes": 1}}
    )
    return {"success": True}


@router.get("/{stream_id}/chat")
async def get_chat(stream_id: str, after: str = Query("")):
    """Get live chat messages"""
    query = {"streamId": stream_id}
    if after:
        query["createdAt"] = {"$gt": after}
    messages = await db.live_chat.find(query).sort("createdAt", 1).limit(100).to_list(100)
    result = []
    for msg in messages:
        user = await db.users.find_one({"_id": msg["userId"]})
        result.append({
            "id": msg["_id"],
            "user": user_doc_to_dict(user),
            "text": msg.get("text", ""),
            "time": time_ago(msg.get("createdAt", "")),
            "createdAt": msg.get("createdAt", ""),
        })
    return result


@router.post("/{stream_id}/chat")
async def send_chat(stream_id: str, text: str = Query(..., min_length=1), user_id: str = Depends(get_current_user)):
    """Send a live chat message"""
    stream = await db.livestreams.find_one({"_id": stream_id, "active": True})
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not active")

    msg_id = str(uuid.uuid4())
    msg_doc = {
        "_id": msg_id,
        "streamId": stream_id,
        "userId": user_id,
        "text": text,
        "createdAt": datetime.utcnow().isoformat(),
    }
    await db.live_chat.insert_one(msg_doc)

    user = await db.users.find_one({"_id": user_id})
    return {
        "id": msg_id,
        "user": user_doc_to_dict(user),
        "text": text,
        "time": "now",
        "createdAt": msg_doc["createdAt"],
    }


@router.post("/{stream_id}/upload-chunk")
async def upload_stream_chunk(
    stream_id: str,
    chunk: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    """Upload video chunk from broadcaster for HLS processing"""
    stream = await db.livestreams.find_one({"_id": stream_id, "active": True})
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not active")
    if stream["userId"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Save incoming chunk
    chunk_path = LIVE_STREAMS_DIR / f"{stream_id}_temp.webm"
    async with aiofiles.open(chunk_path, "ab") as f:
        content = await chunk.read()
        await f.write(content)
    
    # Process with FFmpeg to HLS format
    hls_dir = LIVE_HLS_DIR / stream_id
    hls_dir.mkdir(exist_ok=True)
    
    playlist_path = hls_dir / "stream.m3u8"
    segment_pattern = str(hls_dir / "segment_%03d.ts")
    
    # Convert to HLS in background (append mode for live streaming)
    try:
        subprocess.Popen([
            "ffmpeg", "-i", str(chunk_path),
            "-c:v", "libx264", "-c:a", "aac",
            "-f", "hls",
            "-hls_time", "2",
            "-hls_list_size", "10",
            "-hls_flags", "append_list+delete_segments",
            "-hls_segment_filename", segment_pattern,
            str(playlist_path)
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception as e:
        logger.error(f"FFmpeg error: {e}")
    
    return {"success": True, "streamId": stream_id}


@router.get("/{stream_id}/stream.m3u8")
async def get_hls_playlist(stream_id: str):
    """Serve HLS playlist for viewers"""
    playlist_path = LIVE_HLS_DIR / stream_id / "stream.m3u8"
    if not playlist_path.exists():
        raise HTTPException(status_code=404, detail="Stream not ready")
    
    return FileResponse(
        playlist_path,
        media_type="application/vnd.apple.mpegurl",
        headers={"Cache-Control": "no-cache"}
    )


@router.get("/{stream_id}/{segment_file}")
async def get_hls_segment(stream_id: str, segment_file: str):
    """Serve HLS video segments"""
    if not segment_file.endswith(".ts"):
        raise HTTPException(status_code=400, detail="Invalid segment")
    
    segment_path = LIVE_HLS_DIR / stream_id / segment_file
    if not segment_path.exists():
        raise HTTPException(status_code=404, detail="Segment not found")
    
    return FileResponse(
        segment_path,
        media_type="video/mp2t",
        headers={"Cache-Control": "no-cache"}
    )
