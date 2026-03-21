from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
import uuid


def generate_id():
    return str(uuid.uuid4())


# ---- Auth Models ----
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    displayName: str


class UserLogin(BaseModel):
    email: str
    password: str


class UserUpdate(BaseModel):
    displayName: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    displayName: str
    avatar: str = ""
    bio: str = ""
    followers: int = 0
    following: int = 0
    likes: int = 0
    verified: bool = False
    createdAt: str = ""


class AuthResponse(BaseModel):
    user: UserResponse
    token: str


# ---- Video Models ----
class VideoCreate(BaseModel):
    caption: str = ""
    hashtags: str = ""
    visibility: str = "public"
    allowComments: bool = True
    allowDuet: bool = True
    allowStitch: bool = True


class VideoResponse(BaseModel):
    id: str
    user: UserResponse
    description: str = ""
    music: str = "Original Sound"
    likes: int = 0
    comments: int = 0
    shares: int = 0
    bookmarks: int = 0
    views: int = 0
    videoUrl: str = ""
    thumbnail: str = ""
    hashtags: List[str] = []
    visibility: str = "public"
    allowComments: bool = True
    createdAt: str = ""


# ---- Comment Models ----
class CommentCreate(BaseModel):
    text: str


class CommentResponse(BaseModel):
    id: str
    user: UserResponse
    text: str
    likes: int = 0
    time: str = ""
    replies: int = 0


# ---- Interaction Models ----
class LikeResponse(BaseModel):
    liked: bool
    likeCount: int


class BookmarkResponse(BaseModel):
    bookmarked: bool


class FollowResponse(BaseModel):
    followed: bool


# ---- Discover Models ----
class HashtagResponse(BaseModel):
    tag: str
    posts: str
    icon: str = "hash"


# ---- Notification Models ----
class NotificationResponse(BaseModel):
    id: str
    type: str
    user: UserResponse
    text: str
    time: str
