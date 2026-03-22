from fastapi import APIRouter, HTTPException, Depends
from models.schemas import UserCreate, UserLogin, UserResponse, AuthResponse
from middleware.auth import create_token, get_current_user
from passlib.context import CryptContext
from datetime import datetime
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Will be set from server.py
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
        isAdmin=doc.get("isAdmin", False),
        walletBalance=doc.get("walletBalance", 0),
        totalEarned=doc.get("totalEarned", 0),
        totalSpent=doc.get("totalSpent", 0),
        createdAt=doc.get("createdAt", ""),
    )


@router.post("/register", response_model=AuthResponse)
async def register(data: UserCreate):
    # Check existing
    existing = await db.users.find_one({"$or": [{"email": data.email}, {"username": data.username}]})
    if existing:
        if existing.get("email") == data.email:
            raise HTTPException(status_code=400, detail="Email already registered")
        raise HTTPException(status_code=400, detail="Username already taken")

    user_id = str(uuid.uuid4())
    user_doc = {
        "_id": user_id,
        "username": data.username,
        "email": data.email,
        "password": pwd_context.hash(data.password),
        "displayName": data.displayName,
        "avatar": f"https://api.dicebear.com/7.x/avataaars/svg?seed={data.username}",
        "bio": "",
        "followers": 0,
        "following": 0,
        "likes": 0,
        "verified": False,
        "walletBalance": 100,  # Initial bonus: 100 coins
        "totalEarned": 0,
        "totalSpent": 0,
        "totalGiftsReceived": 0,
        "createdAt": datetime.utcnow().isoformat(),
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_id)
    return AuthResponse(user=user_doc_to_response(user_doc), token=token)


@router.post("/login", response_model=AuthResponse)
async def login(data: UserLogin):
    user_with_id = await db.users.find_one({"email": data.email})
    if not user_with_id or not pwd_context.verify(data.password, user_with_id.get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user_id = str(user_with_id["_id"])  # Convert ObjectId to string for JWT
    # Create user dict with string ID
    user_data = {k: v for k, v in user_with_id.items() if k != "_id"}
    user_data["_id"] = user_id
    token = create_token(user_id)
    return AuthResponse(user=user_doc_to_response(user_data), token=token)


@router.get("/me", response_model=UserResponse)
async def get_me(user_id: str = Depends(get_current_user)):
    from bson import ObjectId
    # Convert string ID back to ObjectId for MongoDB query
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        # If not ObjectId, try string search
        user = await db.users.find_one({"_id": user_id})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Convert ObjectId to string for response
    user_id_str = str(user["_id"])
    user_data = {k: v for k, v in user.items() if k != "_id"}
    user_data["_id"] = user_id_str
    return user_doc_to_response(user_data)
