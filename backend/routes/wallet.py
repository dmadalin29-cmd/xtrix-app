from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from middleware.auth import get_current_user
from datetime import datetime, timezone
import uuid
import logging
import os
import base64
import httpx

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

# Viva Payments Config (will be loaded from env when credentials provided)
VIVA_API_URL = os.getenv("VIVA_API_URL", "https://demo-api.vivapayments.com")
VIVA_MERCHANT_ID = os.getenv("VIVA_MERCHANT_ID", "")
VIVA_API_KEY = os.getenv("VIVA_API_KEY", "")
VIVA_SOURCE_CODE = os.getenv("VIVA_SOURCE_CODE", "")
VIVA_WEBHOOK_SECRET = os.getenv("VIVA_WEBHOOK_SECRET", "")


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
    if amount_eur > 50000:
        raise HTTPException(status_code=400, detail="Amount exceeds maximum limit (50000 EUR)")
    
    # Calculate coins user will receive (amount / PURCHASE_RATE)
    coins = int(amount_eur / PURCHASE_RATE)
    
    # Get user details
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create pending transaction
    tx_id = str(uuid.uuid4())
    order_code = str(uuid.uuid4())[:16]  # Short order code
    
    tx_doc = {
        "_id": tx_id,
        "userId": user_id,
        "orderCode": order_code,
        "type": "topup_pending",
        "amount": coins,
        "amountEur": amount_eur,
        "status": "pending",
        "description": f"Wallet top-up: {coins} coins",
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "webhookReceived": False,
    }
    await db.transactions.insert_one(tx_doc)
    
    # Check if Viva credentials are configured
    if not VIVA_MERCHANT_ID or not VIVA_API_KEY or not VIVA_SOURCE_CODE:
        return {
            "transactionId": tx_id,
            "orderCode": order_code,
            "coins": coins,
            "amountEur": amount_eur,
            "status": "pending",
            "message": "⚠️ Viva Payments credentials not configured. Integration pending.",
            "checkoutUrl": None
        }
    
    try:
        # Create Viva payment order
        auth_header = base64.b64encode(f"{VIVA_MERCHANT_ID}:{VIVA_API_KEY}".encode()).decode()
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{VIVA_API_URL}/checkout/v2/orders",
                json={
                    "amount": int(amount_eur * 100),  # Convert to cents
                    "sourceCode": VIVA_SOURCE_CODE,
                    "customerTrns": f"KdM Wallet Top-up: {coins} coins",
                    "customer": {
                        "email": user.get("email", ""),
                        "fullName": user.get("displayName", ""),
                        "requestLang": "ro-RO"
                    }
                },
                headers={
                    "Authorization": f"Basic {auth_header}",
                    "Content-Type": "application/json"
                },
                timeout=30.0
            )
            response.raise_for_status()
            viva_data = response.json()
            
            if not viva_data.get("Success"):
                raise HTTPException(status_code=400, detail="Viva order creation failed")
            
            viva_order_code = viva_data.get("OrderCode")
            
            # Update transaction with Viva order code
            await db.transactions.update_one(
                {"_id": tx_id},
                {"$set": {"vivaOrderCode": viva_order_code}}
            )
            
            # Generate checkout URL
            checkout_url = f"https://demo.vivapayments.com/web/checkout?ref={viva_order_code}"
            
            return {
                "transactionId": tx_id,
                "orderCode": order_code,
                "vivaOrderCode": viva_order_code,
                "coins": coins,
                "amountEur": amount_eur,
                "status": "pending",
                "checkoutUrl": checkout_url,
                "message": "Redirect user to checkout URL"
            }
    
    except httpx.HTTPStatusError as e:
        logger.error(f"Viva API error: {e.response.text}")
        raise HTTPException(status_code=500, detail=f"Payment gateway error: {e.response.text}")
    except Exception as e:
        logger.error(f"Top-up initiation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/topup/webhook")
async def topup_webhook(request: dict, background_tasks: BackgroundTasks):
    """Webhook endpoint for Viva Payments confirmation"""
    try:
        # Extract webhook data
        event_type_id = request.get("EventTypeId")
        event_data = request.get("EventData", {})
        
        # Transaction Payment Created (1796)
        if event_type_id == 1796:
            transaction_id = event_data.get("transactionId")
            viva_order_code = str(event_data.get("orderCode"))
            amount_cents = event_data.get("amount", 0)
            status_id = event_data.get("statusId")
            
            # Only process if status is Finished (F)
            if status_id == "F":
                amount_eur = amount_cents / 100
                coins = int(amount_eur / PURCHASE_RATE)
                
                # Find transaction
                tx = await db.transactions.find_one({"vivaOrderCode": viva_order_code})
                if tx:
                    user_id = tx.get("userId")
                    
                    # Update wallet balance
                    await db.users.update_one(
                        {"_id": user_id},
                        {"$inc": {"walletBalance": coins}}
                    )
                    
                    # Update transaction status
                    await db.transactions.update_one(
                        {"_id": tx["_id"]},
                        {
                            "$set": {
                                "status": "completed",
                                "vivaTransactionId": transaction_id,
                                "webhookReceived": True,
                                "completedAt": datetime.now(timezone.utc).isoformat()
                            }
                        }
                    )
                    
                    logger.info(f"✅ Top-up completed: {coins} coins added to user {user_id}")
        
        # Transaction Failed (1798)
        elif event_type_id == 1798:
            viva_order_code = str(event_data.get("orderCode"))
            tx = await db.transactions.find_one({"vivaOrderCode": viva_order_code})
            if tx:
                await db.transactions.update_one(
                    {"_id": tx["_id"]},
                    {"$set": {"status": "failed", "webhookReceived": True}}
                )
                logger.info(f"❌ Top-up failed for order {viva_order_code}")
        
        return {"received": True}
    
    except Exception as e:
        logger.error(f"Webhook processing error: {e}")
        return {"received": True}  # Always return 200 to Viva


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
