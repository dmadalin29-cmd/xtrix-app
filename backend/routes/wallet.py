from fastapi import APIRouter, HTTPException, Depends, Query
from middleware.auth import get_current_user
from datetime import datetime, timezone
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/wallet", tags=["wallet"])

db = None

def set_db(database):
    global db
    db = database

# Conversion rates (EUR per coin)
WITHDRAWAL_RATE = 0.01  # 1 coin = 0.01 EUR (base rate for creators)
PURCHASE_RATE = 0.013   # 1 coin = 0.013 EUR (30% markup for buyers)

# Platform revenue split
CREATOR_SHARE = 0.70  # 70% to creator
PLATFORM_SHARE = 0.30  # 30% to platform


@router.get("")
async def get_wallet(user_id: str = Depends(get_current_user)):
    """Get user wallet balance"""
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "balance": user.get("walletBalance", 0),
        "totalEarned": user.get("totalEarned", 0),
        "totalSpent": user.get("totalSpent", 0),
        "conversionRates": {
            "purchase": PURCHASE_RATE,
            "withdrawal": WITHDRAWAL_RATE
        }
    }


@router.get("/transactions")
async def get_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=50),
    user_id: str = Depends(get_current_user)
):
    """Get user transaction history"""
    skip = (page - 1) * limit
    
    transactions = await db.transactions.find(
        {"$or": [{"userId": user_id}, {"recipientId": user_id}]}
    ).sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for tx in transactions:
        tx_data = {
            "id": tx["_id"],
            "type": tx.get("type", ""),
            "amount": tx.get("amount", 0),
            "description": tx.get("description", ""),
            "createdAt": tx.get("createdAt", ""),
        }
        
        # Add related user info for gifts
        if tx.get("type") == "gift_sent" or tx.get("type") == "gift_received":
            other_user_id = tx.get("recipientId") if tx.get("type") == "gift_sent" else tx.get("userId")
            other_user = await db.users.find_one({"_id": other_user_id}, {"_id": 0, "username": 1, "displayName": 1, "avatar": 1})
            tx_data["relatedUser"] = other_user
            
            if tx.get("giftId"):
                gift = await db.gifts.find_one({"_id": tx["giftId"]}, {"_id": 0, "name": 1, "icon": 1})
                tx_data["gift"] = gift
        
        result.append(tx_data)
    
    return result


@router.post("/topup/initiate")
async def initiate_topup(
    amount_eur: float = Query(..., gt=0),
    user_id: str = Depends(get_current_user)
):
    """Initiate wallet top-up via Viva Payments"""
    # Calculate coins user will receive (amount / PURCHASE_RATE)
    coins = int(amount_eur / PURCHASE_RATE)
    
    # Create pending transaction
    tx_id = str(uuid.uuid4())
    tx_doc = {
        "_id": tx_id,
        "userId": user_id,
        "type": "topup_pending",
        "amount": coins,
        "amountEur": amount_eur,
        "status": "pending",
        "description": f"Wallet top-up: {coins} coins",
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    await db.transactions.insert_one(tx_doc)
    
    # TODO: Integrate Viva Payments API here
    # Return payment URL/redirect
    
    return {
        "transactionId": tx_id,
        "coins": coins,
        "amountEur": amount_eur,
        "status": "pending",
        "message": "Viva Payments integration pending - will redirect to payment page"
    }


@router.post("/topup/webhook")
async def topup_webhook():
    """Webhook endpoint for Viva Payments confirmation"""
    # TODO: Verify webhook signature
    # TODO: Parse Viva webhook payload
    # TODO: Update transaction status
    # TODO: Credit user wallet
    
    return {"received": True}


@router.post("/withdraw")
async def withdraw_funds(
    amount: int = Query(..., gt=0),
    user_id: str = Depends(get_current_user)
):
    """Withdraw coins to real money (for creators)"""
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    current_balance = user.get("walletBalance", 0)
    if current_balance < amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    # Calculate EUR amount (using withdrawal rate)
    amount_eur = amount * WITHDRAWAL_RATE
    
    # Deduct from wallet
    await db.users.update_one(
        {"_id": user_id},
        {"$inc": {"walletBalance": -amount}}
    )
    
    # Create transaction record
    tx_id = str(uuid.uuid4())
    tx_doc = {
        "_id": tx_id,
        "userId": user_id,
        "type": "withdrawal",
        "amount": -amount,
        "amountEur": amount_eur,
        "status": "completed",
        "description": f"Withdrawal: {amount} coins → {amount_eur:.2f} EUR",
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    await db.transactions.insert_one(tx_doc)
    
    return {
        "success": True,
        "coinsWithdrawn": amount,
        "amountEur": amount_eur,
        "newBalance": current_balance - amount
    }
