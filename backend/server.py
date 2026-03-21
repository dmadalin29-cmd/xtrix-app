from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'kdm_db')]

# Create app
app = FastAPI(title="KdM API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import and register routes
from routes.auth import router as auth_router, set_db as auth_set_db
from routes.users import router as users_router, set_db as users_set_db
from routes.videos import router as videos_router, set_db as videos_set_db
from routes.discover import router as discover_router, set_db as discover_set_db
from routes.messages import router as messages_router, set_db as messages_set_db

# Set DB references
auth_set_db(db)
users_set_db(db)
videos_set_db(db)
discover_set_db(db)
messages_set_db(db)

# Include routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(videos_router)
app.include_router(discover_router)
app.include_router(messages_router)

# Serve uploaded files
UPLOAD_DIR = os.path.join(ROOT_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Health check
@app.get("/api/")
async def root():
    return {"message": "KdM API is running"}

@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.on_event("startup")
async def startup():
    # Create indexes
    await db.users.create_index("username", unique=True)
    await db.users.create_index("email", unique=True)
    await db.videos.create_index([("createdAt", -1)])
    await db.videos.create_index("userId")
    await db.videos.create_index("hashtags")
    await db.likes.create_index([("userId", 1), ("videoId", 1)], unique=True)
    await db.bookmarks.create_index([("userId", 1), ("videoId", 1)], unique=True)
    await db.follows.create_index([("followerId", 1), ("followingId", 1)], unique=True)
    await db.comments.create_index("videoId")
    await db.notifications.create_index([("userId", 1), ("createdAt", -1)])
    await db.hashtags.create_index("tag", unique=True)
    await db.conversations.create_index("participants")
    await db.conversations.create_index([("updatedAt", -1)])
    await db.messages.create_index([("conversationId", 1), ("createdAt", -1)])
    logger.info("KdM API started - indexes created")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
