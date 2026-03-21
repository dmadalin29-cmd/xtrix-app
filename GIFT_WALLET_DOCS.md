# 🎁 KdM - Gift & Wallet System Documentation

## 📊 Economic Model

### Conversion Rates
- **Purchase Rate**: 1 coin = **0.013 EUR** (cu markup de 30%)
- **Withdrawal Rate**: 1 coin = **0.01 EUR** (rată de bază pentru creatori)

### Revenue Split
- **Creator**: 70% din valoarea cadoului primit
- **Platform**: 30% din valoarea cadoului primit

### Example Flow
1. **User cumpără coins**:
   - Plătește 13 EUR → Primește 1000 coins
   
2. **User trimite cadou de 1000 coins**:
   - Sender: -1000 coins
   - Creator: +700 coins (70%)
   - Platform: +300 coins (30%)

3. **Creator retrage coins**:
   - Retrage 700 coins → Primește 7 EUR

**Platform profit total**: 3 EUR (markup) + 3 EUR (gift split) = **6 EUR per 13 EUR transaction**

---

## 🎁 Gift System

### Available Gifts (20 total)
```
❤️ Inimă - 1 coin
🌹 Trandafir - 2 coins
⭐ Stea - 5 coins
🎂 Tort - 10 coins
🍕 Pizza - 20 coins
🍹 Cocktail - 50 coins
🏆 Trofeu - 100 coins
👑 Coroană - 150 coins
🚗 Mașină - 200 coins
✈️ Avion - 300 coins
💎 Diamant - 500 coins
🦄 Unicorn - 750 coins
🚀 Racheta - 1000 coins
🦁 Leu - 1500 coins
🏰 Castel - 2000 coins
🐉 Dragon - 3000 coins
🚢 Vapor - 5000 coins
🪐 Planetă - 7500 coins
🌌 Galaxie - 10000 coins
💫 Supernova - 15000 coins
```

### Gift Sending API
```bash
POST /api/gifts/send?recipient_id={creator_id}&gift_id={gift_id}&stream_id={stream_id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "gift": {"name": "Pizza", "icon": "🍕", "cost": 20},
  "coinsSpent": 20,
  "creatorReceived": 14,
  "platformFee": 6,
  "newBalance": 80,
  "transactionId": "xxx"
}
```

---

## 💰 Wallet System

### Initial Bonus
- Noi utilizatori primesc **100 coins gratuit** la înregistrare

### API Endpoints

**Get Balance:**
```bash
GET /api/wallet
Authorization: Bearer {token}
```

**Response:**
```json
{
  "balance": 100,
  "totalEarned": 0,
  "totalSpent": 0,
  "conversionRates": {
    "purchase": 0.013,
    "withdrawal": 0.01
  }
}
```

**Top-up Initiation:**
```bash
POST /api/wallet/topup/initiate?amount_eur=10
Authorization: Bearer {token}
```

**Response:**
```json
{
  "transactionId": "xxx",
  "orderCode": "xxx",
  "vivaOrderCode": 123456789,
  "coins": 769,
  "amountEur": 10,
  "status": "pending",
  "checkoutUrl": "https://demo.vivapayments.com/web/checkout?ref=xxx",
  "message": "Redirect user to checkout URL"
}
```

**Withdraw:**
```bash
POST /api/wallet/withdraw?amount=100
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "coinsWithdrawn": 100,
  "amountEur": 1.0,
  "newBalance": 0
}
```

**Transaction History:**
```bash
GET /api/wallet/transactions?page=1
Authorization: Bearer {token}
```

---

## 📡 Live Streaming (HLS)

### Start Live Stream
```bash
POST /api/live/start?title=My%20Stream&category=music
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": "stream-id",
  "user": {...},
  "title": "My Stream",
  "category": "music",
  "viewers": 0,
  "likes": 0,
  "active": true,
  "startedAt": "2026-03-21T15:00:00",
  "hlsUrl": "/api/live/{stream_id}/stream.m3u8"
}
```

### Upload Video Chunks (from broadcaster)
```bash
POST /api/live/{stream_id}/upload-chunk
Authorization: Bearer {token}
Content-Type: multipart/form-data

chunk: <video_blob>
```

Chunks are processed by FFmpeg and converted to HLS format (.m3u8 playlist + .ts segments).

### View Stream (for viewers)
```bash
GET /api/live/{stream_id}/stream.m3u8
```

Returns HLS playlist. Use with `hls.js` in browser:
```javascript
import Hls from 'hls.js';

const hls = new Hls();
hls.loadSource(`${API_URL}/api/live/${streamId}/stream.m3u8`);
hls.attachMedia(videoElement);
```

### End Stream
```bash
POST /api/live/{stream_id}/end
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "duration": 300,
  "peakViewers": 50,
  "totalLikes": 100
}
```

---

## 💳 Viva Payments Integration

### Configuration Required
Add to `/app/backend/.env`:
```bash
VIVA_API_URL=https://demo-api.vivapayments.com
VIVA_MERCHANT_ID=your_merchant_id
VIVA_API_KEY=your_api_key
VIVA_SOURCE_CODE=your_source_code
VIVA_WEBHOOK_SECRET=your_webhook_secret
```

### Getting Credentials
1. Create account at https://www.viva.com/en-ro/
2. Complete onboarding process
3. Go to Settings → API Access
4. Copy: Merchant ID, API Key
5. Go to Sales → Online Payments → Websites/Apps
6. Create Payment Source → Get Source Code
7. Generate webhook secret (random 32+ char string)

### Webhook Endpoint
Viva will send payment notifications to:
```
POST /api/wallet/topup/webhook
```

**Configure in Viva Dashboard:**
- Success URL: `https://your-domain.com/payment-success`
- Failure URL: `https://your-domain.com/payment-failure`
- Webhook URL: `https://your-domain.com/api/wallet/topup/webhook`

**Webhook Events:**
- `EventTypeId: 1796` - Transaction Payment Created (success)
- `EventTypeId: 1798` - Transaction Failed

When payment succeeds:
1. Webhook received → Verify signature
2. Extract `orderCode`, `transactionId`, `amount`
3. Find pending transaction in DB
4. Credit user wallet with coins
5. Update transaction status to "completed"

---

## 🧪 Testing

### Manual Tests Performed
✅ **Gift Sending**: 
- Sender: 100 → 80 coins
- Creator: 100 → 114 coins (+14 = 70% of 20)
- Platform: +6 coins (30%)

✅ **Withdraw**:
- 50 coins → 0.50 EUR

✅ **Live Streaming**:
- Start stream → Active streams count increases
- End stream → Returns duration and stats

### Automated Tests
Testing agent created `/app/backend/tests/test_live_wallet_gifts.py`:
- 25 backend tests (100% pass rate)
- Coverage: Live (start, end, join, leave, like, chat), Wallet (balance, topup, withdraw), Gifts (list, send)

---

## 🎨 Frontend Components

### GoLiveStudio (`/live/studio`)
- Camera access via `navigator.mediaDevices.getUserMedia()`
- MediaRecorder captures video/audio chunks every 2 seconds
- Chunks uploaded to backend via POST `/api/live/{stream_id}/upload-chunk`
- Live chat polling every 3 seconds
- Real-time stats: duration, viewers, likes

### LivePage (`/live`)
- Grid of active streams
- Click stream → Opens StreamViewer modal
- HLS video player (hls.js)
- Live chat polling
- Gift panel with 20 gifts in 3-column grid

### WalletModal
- 3 tabs: Top-Up, Retrage (Withdraw), Istoric (History)
- Top-Up: Input EUR amount → Redirect to Viva
- Withdraw: Input coins amount → Convert to EUR and process
- History: Shows all transactions with type and amount

### UI Elements Added
- **Header**: "Go LIVE" button (roz gradient), Wallet balance display (auriu)
- **Sidebar**: LIVE menu item cu dot roșu indicator

---

## 🔮 Status

### ✅ Completed (FAZA 1 & 2)
- Go Live streaming cu HLS (backend + frontend)
- Wallet system cu balance tracking
- Gift system cu 20 cadouri
- Revenue split 70/30 implementat și testat
- Wallet modal cu toate tab-urile
- Testing complet (25/25 backend tests passed)

### ⏳ Pending (FAZA 3)
- Viva Payments: Aștept credențiale de la user
- După primirea credențialelor:
  1. Adaugă în `.env`
  2. Restart backend
  3. Test top-up flow complet
  4. Configurează webhook URL în Viva Dashboard

### 📋 Upcoming (FAZA 4)
- Dark/Light mode toggle
- Video recommendations algorithm
- Nested comment replies UI

---

## 📞 Support

Pentru întrebări despre:
- **Viva Payments setup**: https://euhelp.viva.com/
- **HLS streaming issues**: Verifică `/var/log/supervisor/backend.*.log`
- **FFmpeg**: `ffmpeg -version` (instalat: v5.1.8)

---

**Last Updated**: March 21, 2026
**Status**: 🟢 Production Ready (pending Viva credentials)
