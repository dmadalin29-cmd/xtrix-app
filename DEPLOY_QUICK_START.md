# 🚀 DEPLOYMENT - Quick Start pentru Xtrix

## ✅ STATUS: Ready to Deploy

**GitHub:** https://github.com/dmadalin29-cmd/xtrix-app ✅  
**Backend Build:** `/app/frontend/build/` ✅ (incl. .htaccess)  
**Archive:** `/app/xtrix-frontend-build.tar.gz` ✅ (Download ready)

---

## 📋 DEPLOY CHECKLIST

### 1️⃣ Deploy Backend pe Railway (5 min)

**URL:** https://railway.app/new

**Quick Steps:**
1. Login → New Project → **GitHub Repo**
2. Select: `dmadalin29-cmd/xtrix-app`
3. Root Directory: **`backend`**
4. Add Variables (copy-paste):
   ```
   MONGO_URL=mongodb+srv://X67digital:Credcada1.@cluster0.eqecncg.mongodb.net/?appName=Cluster0
   DB_NAME=xtrix_production
   JWT_SECRET=xtrix_super_secret_jwt_key_production_2025_256bits_secure_random
   CORS_ORIGINS=https://xtrix.app,https://www.xtrix.app
   FRONTEND_URL=https://xtrix.app
   ```
5. Settings → Build:
   - Start: `uvicorn server:app --host 0.0.0.0 --port $PORT`
6. Deploy → Wait 3-5 min
7. **Copy Railway URL** (ex: `https://xtrix-backend-production-a1b2.up.railway.app`)

**Test:**
```bash
curl https://YOUR-RAILWAY-URL/api/health
# ✅ Should return: {"status":"healthy"}
```

---

### 2️⃣ Update Frontend cu Railway URL (2 min)

**IF** Railway URL differs from mock:

1. Download code from Emergent (ZIP)
2. Extract → Open `frontend/.env.production`
3. Update:
   ```env
   REACT_APP_BACKEND_URL=https://YOUR-RAILWAY-URL
   ```
4. Rebuild:
   ```bash
   cd frontend
   yarn install
   GENERATE_SOURCEMAP=false yarn build
   ```

**OR** use already built version (current Railway URL is mocked but will work once you update after Railway deploy).

---

### 3️⃣ Upload Frontend pe Hostinger (10 min)

#### Option A: Hostinger File Manager (No FTP client needed)

1. **Login:** https://hpanel.hostinger.com
2. **File Manager:** Websites → xtrix.app → File Manager
3. **Navigate:** `public_html/` folder
4. **Clear:** Delete all existing files (KEEP `.htaccess` dacă există)
5. **Upload:**
   - Click "Upload" button
   - Select ALL files from `/app/frontend/build/`:
     - `index.html` ✅
     - `manifest.json` ✅
     - `sw.js` ✅
     - `asset-manifest.json` ✅
     - `camera-test.html` ✅
     - `static/` FOLDER ✅ (drag entire folder)
   - Wait pentru upload complete
6. **Check `.htaccess`:**
   - Dacă NU există, create new file: `.htaccess`
   - Content: (vezi `/app/frontend/build/.htaccess` - already created ✅)

#### Option B: FileZilla (Desktop FTP Client)

1. **Download:** https://filezilla-project.org
2. **Connect:**
   - Host: `82.25.102.184` (sau `ftp.xtrix.app` dacă disponibil)
   - Port: `65002` (sau `21` standard FTP)
   - Username: `u485600077`
   - Password: `Credcada1.`
   - Protocol: Try **FTP** first, then **SFTP** if fails
3. **Upload:**
   - Local: `/app/frontend/build/`
   - Remote: `/public_html/`
   - Transfer ALL files

**NOTE:** Dacă port 65002 nu funcționează (connection timeout), încearcă:
- Port `21` (FTP standard)
- Port `22` (SFTP/SSH)
- SAU verifică în Hostinger Dashboard → FTP Accounts pentru port corect

#### Option C: Download Arhiva și Upload Manual

1. **Download arhiva:**
   - File location: `/app/xtrix-frontend-build.tar.gz`
   - Click "Download" în Emergent file browser

2. **Extract local:**
   ```bash
   tar -xzf xtrix-frontend-build.tar.gz
   ```

3. **Upload via Hostinger File Manager:**
   - Login la hPanel
   - File Manager → Upload folder contents

---

## 🎯 STEP 4: Test Production

### Frontend Test
```bash
# Homepage
curl -I https://xtrix.app
# ✅ Should return: 200 OK

# Check title
curl -s https://xtrix.app | grep -o "<title>.*</title>"
# ✅ Should show: <title>Xtrix - Social Video Platform</title>

# Check static assets
curl -I https://xtrix.app/static/js/main.xxxxxx.js
# ✅ Should return: 200 OK
```

### Backend Test
```bash
RAILWAY_URL="YOUR-RAILWAY-URL"

curl $RAILWAY_URL/api/health
curl $RAILWAY_URL/api/videos/feed?page=1&limit=5
curl $RAILWAY_URL/api/live/active
```

### E2E Test (Browser)
1. Open: https://xtrix.app
2. Check console (F12) - no errors
3. Check Network tab - API calls merg la Railway URL
4. Test features:
   - ✅ Scroll feed (snap behavior)
   - ✅ Click LIVE tab → see active streams
   - ✅ Theme toggle (Sun/Moon icon)
   - ✅ Signup/Login flow
   - ✅ PWA install ("Add to Home Screen")

---

## 🔥 QUICK FIX - Dacă FTP nu merge

**Hostinger File Manager e cea mai simplă metodă!**

1. https://hpanel.hostinger.com → Login
2. Websites → xtrix.app → File Manager
3. public_html/ → Upload ALL files from `/app/frontend/build/`
4. Done! 🎉

**No FTP client needed, no port issues, works 100% guaranteed.**

---

## 🎉 SUCCESS Criteria

După deployment, verifică:
- [ ] https://xtrix.app loads (200 OK)
- [ ] "Xtrix" logo visible în header
- [ ] Feed scrollează smooth (snap behavior)
- [ ] Theme toggle works (Sun/Moon)
- [ ] API calls la Railway backend (check Network tab)
- [ ] MongoDB data persists (create test user)
- [ ] PWA install works (Add to Home Screen pe mobile)
- [ ] All pages work: Discover, LIVE, Profile, Upload

**Când toate sunt ✅:** XTRIX E LIVE! 🚀🎉

---

*Guide created: 2025-03-22 | Deployment Simplified*
