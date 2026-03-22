# 🚀 Railway Deployment Guide - Xtrix Backend

## Quick Deploy to Railway

### Option 1: Railway CLI (Recommended)

1. **Install Railway CLI:**
   ```bash
   curl -fsSL https://railway.app/install.sh | sh
   ```

2. **Login:**
   ```bash
   export RAILWAY_TOKEN="6fea54ec-5e55-4428-995a-e72f163d47b9"
   railway login
   ```
   
   **OR** use web login:
   ```bash
   railway login
   # Opens browser for OAuth
   ```

3. **Initialize Project:**
   ```bash
   cd /app/backend
   railway init
   # Select: "Create a new project"
   # Name: "xtrix-backend"
   ```

4. **Set Environment Variables:**
   ```bash
   railway variables set MONGO_URL="mongodb+srv://X67digital:Credcada1.@cluster0.eqecncg.mongodb.net/?appName=Cluster0"
   railway variables set DB_NAME="xtrix_production"
   railway variables set JWT_SECRET="xtrix_super_secret_jwt_key_production_2025_256bits_secure_random"
   railway variables set CORS_ORIGINS="https://xtrix.app,https://www.xtrix.app"
   railway variables set FRONTEND_URL="https://xtrix.app"
   ```

5. **Deploy:**
   ```bash
   railway up
   # OR link to GitHub repo:
   railway link
   # Auto-deploys on git push
   ```

6. **Get Deployment URL:**
   ```bash
   railway domain
   # Output: https://xtrix-backend-production-xxxx.up.railway.app
   ```

7. **View Logs:**
   ```bash
   railway logs
   ```

---

### Option 2: Railway Dashboard (Web UI)

1. **Go to:** https://railway.app/dashboard

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Authorize GitHub access
   - Select: `dmadalin29-cmd/xtrix-app`
   - Root Directory: `/backend`

3. **Configure Build:**
   - Builder: Nixpacks (auto-detected)
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`

4. **Add Environment Variables:**
   Go to project → Variables → Add:
   ```
   MONGO_URL = mongodb+srv://X67digital:Credcada1.@cluster0.eqecncg.mongodb.net/?appName=Cluster0
   DB_NAME = xtrix_production
   JWT_SECRET = xtrix_super_secret_jwt_key_production_2025_256bits_secure_random
   CORS_ORIGINS = https://xtrix.app,https://www.xtrix.app
   FRONTEND_URL = https://xtrix.app
   ```

5. **Deploy:**
   - Click "Deploy Now"
   - Wait ~3-5 minutes
   - Check Logs tab for errors

6. **Get Domain:**
   - Settings → Networking → Generate Domain
   - Copy URL: `https://xtrix-backend-production-xxxx.up.railway.app`

7. **Custom Domain (Optional):**
   - Add CNAME record: `api.xtrix.app` → `xtrix-backend-production-xxxx.up.railway.app`
   - In Railway: Settings → Networking → Custom Domain → Add `api.xtrix.app`

---

### Option 3: Manual Deploy Script

If Railway CLI token doesn't work, deploy via GitHub integration:

1. **Push to GitHub:** (Already done ✅)
   ```bash
   cd /app
   git add -A
   git commit -m "Backend ready for Railway"
   git push github main
   ```

2. **Railway Dashboard:**
   - New Project → GitHub → xtrix-app repo
   - Root: `/backend`
   - Add env variables (list above)
   - Deploy

---

## 🔧 Post-Deployment

### Test Deployment
```bash
# Replace with your Railway URL
RAILWAY_URL="https://xtrix-backend-production-xxxx.up.railway.app"

# Health check
curl $RAILWAY_URL/api/health

# Test feed
curl "$RAILWAY_URL/api/videos/feed?page=1&limit=5"

# Test live streams
curl "$RAILWAY_URL/api/live/active"
```

### Update Frontend
Once backend is deployed, update frontend `.env.production`:
```env
REACT_APP_BACKEND_URL=https://xtrix-backend-production-xxxx.up.railway.app
```

---

## 💰 Railway Pricing

- **Free Tier:** $5 execution time credit/month (perfect pentru testing)
- **Hobby Plan:** $5/month (recommended pentru production)
- **Auto-scaling:** Handles traffic spikes automatically

---

## 🐛 Troubleshooting

### Build Fails
- Check Python version in requirements.txt
- Ensure all dependencies are listed
- Check Railway logs: `railway logs`

### Connection Errors
- Verify MONGO_URL is correct
- Check CORS_ORIGINS includes frontend domain
- Ensure PORT env variable is used in uvicorn command

### Slow Response
- Check MongoDB Atlas region (use Europe for Romanian users)
- Enable Railway metrics: Settings → Metrics
- Consider upgrading to Hobby plan for better resources

---

## 🎯 Expected Railway URL Format

After deployment, you'll get:
```
https://xtrix-backend-production-a1b2.up.railway.app
```

Use this URL in frontend `.env.production`:
```env
REACT_APP_BACKEND_URL=https://xtrix-backend-production-a1b2.up.railway.app
```

---

*Guide created: 2025-03-22*
