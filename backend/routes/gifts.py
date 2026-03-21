from fastapi import APIRouter, HTTPException, Depends, Query
from middleware.auth import get_current_user
from datetime import datetime, timezone
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/gifts", tags=["gifts"])

db = None

def set_db(database):
    global db
    db = database

# Platform revenue split
CREATOR_SHARE = 0.70  # 70% to creator
PLATFORM_SHARE = 0.30  # 30% to platform


@router.get("")
async def get_all_gifts():
    """Get all available gifts"""
    gifts = await db.gifts.find({}).sort("cost", 1).to_list(100)
    # Convert _id to id for frontend compatibility
    result = []
    for gift in gifts:
        gift_data = {
            "id": gift["_id"],
            "_id": gift["_id"],  # Keep both for compatibility
            "name": gift.get("name", ""),
            "icon": gift.get("icon", ""),
            "cost": gift.get("cost", 0),
            "animation": gift.get("animation", "")
        }
        result.append(gift_data)
    return result


@router.post("/send")
async def send_gift(
    recipient_id: str = Query(...),
    gift_id: str = Query(...),
    stream_id: str = Query(None),
    user_id: str = Depends(get_current_user)
):
    """Send a gift to a creator"""
    # Get gift details
    gift = await db.gifts.find_one({"_id": gift_id})
    if not gift:
        raise HTTPException(status_code=404, detail="Gift not found")
    
    # Check sender balance
    sender = await db.users.find_one({"_id": user_id})
    if not sender:
        raise HTTPException(status_code=404, detail="Sender not found")
    
    gift_cost = gift.get("cost", 0)
    sender_balance = sender.get("walletBalance", 0)
    
    if sender_balance < gift_cost:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    # Check recipient exists
    recipient = await db.users.find_one({"_id": recipient_id})
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    
    # Calculate split
    creator_coins = int(gift_cost * CREATOR_SHARE)  # 70%
    platform_coins = gift_cost - creator_coins  # 30%
    
    # Deduct from sender
    await db.users.update_one(
        {"_id": user_id},
        {
            "$inc": {"walletBalance": -gift_cost, "totalSpent": gift_cost}
        }
    )
    
    # Add to recipient (creator gets 70%)
    await db.users.update_one(
        {"_id": recipient_id},
        {
            "$inc": {
                "walletBalance": creator_coins,
                "totalEarned": creator_coins,
                "totalGiftsReceived": 1
            }
        }
    )
    
    # Track platform revenue
    await db.platform_stats.update_one(
        {"_id": "revenue"},
        {
            "$inc": {"totalRevenue": platform_coins, "totalGiftRevenue": platform_coins}
        },
        upsert=True
    )
    
    # Create transaction records
    tx_id = str(uuid.uuid4())
    
    # Sender transaction
    tx_sent = {
        "_id": tx_id,
        "userId": user_id,
        "recipientId": recipient_id,
        "giftId": gift_id,
        "type": "gift_sent",
        "amount": -gift_cost,
        "description": f"Sent {gift['name']} to @{recipient['username']}",
        "streamId": stream_id,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    await db.transactions.insert_one(tx_sent)
    
    # Recipient transaction
    tx_received = {
        "_id": str(uuid.uuid4()),
        "userId": recipient_id,
        "senderId": user_id,
        "giftId": gift_id,
        "type": "gift_received",
        "amount": creator_coins,
        "description": f"Received {gift['name']} from @{sender['username']}",
        "streamId": stream_id,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    await db.transactions.insert_one(tx_received)
    
    # Create notification for recipient
    notif_id = str(uuid.uuid4())
    notif_doc = {
        "_id": notif_id,
        "userId": recipient_id,
        "fromUserId": user_id,
        "type": "gift",
        "text": f"sent you {gift['name']}",
        "giftId": gift_id,
        "streamId": stream_id,
        "read": False,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    await db.notifications.insert_one(notif_doc)
    
    return {
        "success": True,
        "gift": gift,
        "coinsSpent": gift_cost,
        "creatorReceived": creator_coins,
        "platformFee": platform_coins,
        "newBalance": sender_balance - gift_cost,
        "transactionId": tx_id
    }


@router.post("/seed")
async def seed_gifts():
    """Seed initial gift data (admin only - remove in production)"""
    # Check if gifts already exist
    existing = await db.gifts.count_documents({})
    if existing > 0:
        return {"message": "Gifts already seeded", "count": existing}
    
    # 20 gifts with increasing prices
    gifts_data = [
        {"_id": str(uuid.uuid4()), "name": "Inimă", "icon": "❤️", "cost": 1, "animation": "heart"},
        {"_id": str(uuid.uuid4()), "name": "Trandafir", "icon": "🌹", "cost": 2, "animation": "float"},
        {"_id": str(uuid.uuid4()), "name": "Stea", "icon": "⭐", "cost": 5, "animation": "sparkle"},
        {"_id": str(uuid.uuid4()), "name": "Tort", "icon": "🎂", "cost": 10, "animation": "bounce"},
        {"_id": str(uuid.uuid4()), "name": "Pizza", "icon": "🍕", "cost": 20, "animation": "spin"},
        {"_id": str(uuid.uuid4()), "name": "Cocktail", "icon": "🍹", "cost": 50, "animation": "shake"},
        {"_id": str(uuid.uuid4()), "name": "Trofeu", "icon": "🏆", "cost": 100, "animation": "trophy"},
        {"_id": str(uuid.uuid4()), "name": "Coroană", "icon": "👑", "cost": 150, "animation": "crown"},
        {"_id": str(uuid.uuid4()), "name": "Mașină", "icon": "🚗", "cost": 200, "animation": "zoom"},
        {"_id": str(uuid.uuid4()), "name": "Avion", "icon": "✈️", "cost": 300, "animation": "fly"},
        {"_id": str(uuid.uuid4()), "name": "Diamant", "icon": "💎", "cost": 500, "animation": "diamond"},
        {"_id": str(uuid.uuid4()), "name": "Unicorn", "icon": "🦄", "cost": 750, "animation": "rainbow"},
        {"_id": str(uuid.uuid4()), "name": "Racheta", "icon": "🚀", "cost": 1000, "animation": "rocket"},
        {"_id": str(uuid.uuid4()), "name": "Leu", "icon": "🦁", "cost": 1500, "animation": "roar"},
        {"_id": str(uuid.uuid4()), "name": "Castel", "icon": "🏰", "cost": 2000, "animation": "castle"},
        {"_id": str(uuid.uuid4()), "name": "Dragon", "icon": "🐉", "cost": 3000, "animation": "dragon"},
        {"_id": str(uuid.uuid4()), "name": "Vapor", "icon": "🚢", "cost": 5000, "animation": "ship"},
        {"_id": str(uuid.uuid4()), "name": "Planetă", "icon": "🪐", "cost": 7500, "animation": "orbit"},
        {"_id": str(uuid.uuid4()), "name": "Galaxie", "icon": "🌌", "cost": 10000, "animation": "galaxy"},
        {"_id": str(uuid.uuid4()), "name": "Supernova", "icon": "💫", "cost": 15000, "animation": "supernova"},
    ]
    
    await db.gifts.insert_many(gifts_data)
    
    return {
        "success": True,
        "giftsCreated": len(gifts_data),
        "message": "20 gifts seeded successfully"
    }
