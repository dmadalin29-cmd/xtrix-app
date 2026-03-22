# 🚀 Complete Deployment Script - Xtrix

## BACKEND → Railway

Railway token provided doesn't work directly via CLI. Use **Railway Dashboard** method:

### Steps:
1. Go to: https://railway.app/dashboard
2. Login cu contul tău
3. New Project → Deploy from GitHub
4. Select: `dmadalin29-cmd/xtrix-app`
5. **IMPORTANT:** Set Root Directory = `backend`
6. Add Environment Variables:
   ```
   MONGO_URL = mongodb+srv://X67digital:Credcada1.@cluster0.eqecncg.mongodb.net/?appName=Cluster0
   DB_NAME = xtrix_production
   JWT_SECRET = xtrix_super_secret_jwt_key_production_2025_256bits_secure_random
   CORS_ORIGINS = https://xtrix.app,https://www.xtrix.app
   FRONTEND_URL = https://xtrix.app
   PORT = 8001
   ```
7. Settings → Build:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
8. Deploy Now
9. **Copy Railway URL** (ex: `https://xtrix-backend-production-a1b2.up.railway.app`)

---

## FRONTEND → Hostinger FTP (xtrix.app)

### Prerequisites
Railway backend URL from step above (ex: `https://xtrix-backend-production-xxxx.up.railway.app`)

### Build Production Frontend
```bash
cd /app/frontend

# Create .env.production with Railway backend URL
echo "REACT_APP_BACKEND_URL=https://xtrix-backend-production-xxxx.up.railway.app" > .env.production
echo "WDS_SOCKET_PORT=443" >> .env.production
echo "ENABLE_HEALTH_CHECK=false" >> .env.production

# Build optimized
GENERATE_SOURCEMAP=false yarn build
```

### Upload to Hostinger via FTP
```bash
# Install lftp for automated FTP
apt-get install -y lftp

# Upload build folder
lftp -u u485600077,Credcada1. -p 65002 82.25.102.184 <<EOF
set ssl:verify-certificate no
mirror -R /app/frontend/build/ /public_html/
bye
EOF
```

**OR** use FileZilla GUI:
- Host: 82.25.102.184
- Port: 65002
- Username: u485600077
- Password: Credcada1.
- Upload `build/` contents to `/public_html/`

### Verify Deployment
```bash
curl -I https://xtrix.app
# Should return 200 OK with Xtrix title
```

---

## Quick Deploy Commands (After Railway Setup)

```bash
# 1. Get Railway backend URL
RAILWAY_BACKEND_URL="https://xtrix-backend-production-xxxx.up.railway.app"

# 2. Update frontend env
cd /app/frontend
echo "REACT_APP_BACKEND_URL=$RAILWAY_BACKEND_URL" > .env.production
echo "WDS_SOCKET_PORT=443" >> .env.production
echo "ENABLE_HEALTH_CHECK=false" >> .env.production

# 3. Build frontend
GENERATE_SOURCEMAP=false yarn build

# 4. Upload to Hostinger FTP
cd /app
apt-get update && apt-get install -y lftp
lftp -u u485600077,Credcada1. -p 65002 82.25.102.184 <<EOF
set ssl:verify-certificate no
cd public_html
mirror -R frontend/build/ ./
bye
EOF

# 5. Test
curl https://xtrix.app
curl $RAILWAY_BACKEND_URL/api/health
```

---

## Post-Deployment Checklist

- [ ] Backend pe Railway: Health check OK (`/api/health` returns 200)
- [ ] Frontend pe Hostinger: https://xtrix.app loads correctly
- [ ] API Connection: Frontend poate call backend (check Network tab)
- [ ] MongoDB Atlas: Connected și queries working
- [ ] PWA Install: "Add to Home Screen" funcționează
- [ ] Mobile Test: Deschide pe telefon și testează scroll, swipe, theme

---

## 🔒 Security Notes

**IMPORTANT:** 
- GitHub repo este PUBLIC - **NU** commit `.env` files cu credentials
- `.gitignore` deja exclude `.env` files ✅
- Railway env variables stored securizat în dashboard
- MongoDB connection string hidden în Railway env

**Recommended:**
- Add `.env.production` la `.gitignore` (already ignored ✅)
- Rotate JWT_SECRET every 90 days
- Enable MongoDB IP Whitelist (add Railway IPs)

---

*Created: 2025-03-22 | Deployment Ready*
