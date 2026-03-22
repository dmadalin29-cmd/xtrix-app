# 🚀 Xtrix - Manual Deployment Guide (Step-by-Step)

## ⚠️ IMPORTANT: Railway Token Issue

Railway CLI token provided (`6fea54ec-5e55-4428-995a-e72f163d47b9`) nu funcționează direct. **Soluție:** Folosește Railway Dashboard cu GitHub integration.

---

## 📦 STEP 1: Deploy Backend pe Railway

### Via Railway Dashboard (Recomandat)

1. **Login la Railway:**
   - Mergi la: https://railway.app/dashboard
   - Login cu contul tău (GitHub/Email)

2. **Create New Project:**
   - Click "New Project"
   - Select: **"Deploy from GitHub repo"**
   - Authorize Railway să acceseze GitHub
   - Select repo: **`dmadalin29-cmd/xtrix-app`** ✅ (Already pushed!)

3. **Configure Service:**
   - **Root Directory:** `backend` (IMPORTANT!)
   - **Name:** `xtrix-backend`

4. **Add Environment Variables:**
   Click Variables tab → Add următoarele:
   
   ```
   MONGO_URL
   mongodb+srv://X67digital:Credcada1.@cluster0.eqecncg.mongodb.net/?appName=Cluster0

   DB_NAME
   xtrix_production

   JWT_SECRET
   xtrix_super_secret_jwt_key_production_2025_256bits_secure_random

   CORS_ORIGINS
   https://xtrix.app,https://www.xtrix.app

   FRONTEND_URL
   https://xtrix.app

   PORT
   8001
   ```

5. **Configure Build Settings:**
   - Settings → Build:
     - **Install Command:** `pip install -r requirements.txt`
     - **Start Command:** `uvicorn server:app --host 0.0.0.0 --port $PORT`
   - Save

6. **Deploy:**
   - Click "Deploy" button
   - Wait ~3-5 minutes (check Logs tab)
   - Status: "Deployed" ✅

7. **Get Backend URL:**
   - Settings → Networking → **Generate Domain**
   - Copy URL (ex: `https://xtrix-backend-production-a1b2.up.railway.app`)
   - **IMPORTANT:** Salvează acest URL - îl folosești pentru frontend!

8. **Test Backend:**
   ```bash
   curl https://xtrix-backend-production-xxxx.up.railway.app/api/health
   # Should return: {"status": "healthy"}
   ```

---

## 🌐 STEP 2: Build Frontend cu Railway Backend URL

**DUPĂ ce ai Railway URL din Step 1:**

1. **Update `.env.production`:**
   ```bash
   cd /app/frontend
   
   # Replace cu Railway URL real
   echo "REACT_APP_BACKEND_URL=https://xtrix-backend-production-xxxx.up.railway.app" > .env.production
   echo "WDS_SOCKET_PORT=443" >> .env.production
   echo "ENABLE_HEALTH_CHECK=false" >> .env.production
   ```

2. **Build Production:**
   ```bash
   GENERATE_SOURCEMAP=false yarn build
   ```

3. **Verify Build:**
   ```bash
   ls -lh build/
   # Should show: index.html, manifest.json, sw.js, static/ folder
   ```

**Build folder location:** `/app/frontend/build/`

---

## 📤 STEP 3: Upload Frontend pe Hostinger (xtrix.app)

### Credentials Hostinger FTP:
- **Host:** 82.25.102.184
- **Port:** 65002
- **Username:** u485600077
- **Password:** Credcada1.
- **Target Directory:** `/public_html/` (sau `/domains/xtrix.app/public_html/`)

---

### Method 1: Hostinger File Manager (EASIEST ⭐)

1. **Login la Hostinger:**
   - https://hpanel.hostinger.com
   - Login cu contul tău

2. **Navigate to File Manager:**
   - Dashboard → xtrix.app → File Manager
   - Sau direct: Websites → xtrix.app → File Manager

3. **Clear Old Files:**
   - Navigate to `public_html/` folder
   - Select all files → Delete (păstrează `.htaccess` dacă există)

4. **Upload Build Files:**
   - Click "Upload" button
   - **IMPORTANT:** Upload toate fișierele din `/app/frontend/build/` folder:
     - ✅ `index.html`
     - ✅ `manifest.json`
     - ✅ `sw.js`
     - ✅ `asset-manifest.json`
     - ✅ `camera-test.html`
     - ✅ `static/` folder (ÎNTREG)
   
   **NOTE:** File Manager permite upload folder întreg. Select `build/` folder și drag-drop.

5. **Verify Upload:**
   - Check că `public_html/` conține:
     ```
     public_html/
     ├── index.html
     ├── manifest.json
     ├── sw.js
     ├── asset-manifest.json
     └── static/
         ├── css/
         ├── js/
         └── media/
     ```

6. **Configure `.htaccess` (pentru React Router):**
   Create `public_html/.htaccess`:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteCond %{REQUEST_FILENAME} !-l
     RewriteRule . /index.html [L]
   </IfModule>

   # Enable GZIP compression
   <IfModule mod_deflate.c>
     AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
   </IfModule>

   # Cache static assets
   <IfModule mod_expires.c>
     ExpiresActive On
     ExpiresByType image/jpg "access plus 1 year"
     ExpiresByType image/jpeg "access plus 1 year"
     ExpiresByType image/gif "access plus 1 year"
     ExpiresByType image/png "access plus 1 year"
     ExpiresByType text/css "access plus 1 month"
     ExpiresByType application/javascript "access plus 1 month"
   </IfModule>
   ```

---

### Method 2: FileZilla (Desktop App)

1. **Download FileZilla:**
   - https://filezilla-project.org/download.php?type=client
   - Install pe PC/Mac

2. **Connect:**
   - Host: `82.25.102.184`
   - Username: `u485600077`
   - Password: `Credcada1.`
   - Port: `65002`
   - Protocol: FTP (sau SFTP dacă 65002 e SSH port)
   - Click "Quickconnect"

3. **Navigate:**
   - Remote site: `/public_html/` (sau `/domains/xtrix.app/public_html/`)
   - Local site: `/app/frontend/build/`

4. **Upload:**
   - Select ALL files din `build/` folder (local)
   - Drag to `public_html/` (remote)
   - Wait pentru upload complete (~5-10 min pentru toate assets)

5. **Add `.htaccess`:**
   - Create new file în `public_html/`: `.htaccess`
   - Content: (vezi Method 1, step 6)

---

### Method 3: Hostinger SSH (Advanced)

Dacă Hostinger are SSH access enabled:

```bash
# Connect via SSH
ssh u485600077@82.25.102.184 -p 65002

# On server:
cd domains/xtrix.app/public_html/
rm -rf *  # Clear old files
exit

# From local:
scp -P 65002 -r /app/frontend/build/* u485600077@82.25.102.184:/domains/xtrix.app/public_html/
```

---

## ✅ STEP 4: Verify Deployment

### Test Frontend
```bash
# Homepage
curl -I https://xtrix.app
# Should return: 200 OK

# Check title
curl -s https://xtrix.app | grep "<title>"
# Should show: <title>Xtrix - Social Video Platform</title>
```

### Test Backend (Railway)
```bash
# Health check
curl https://xtrix-backend-production-xxxx.up.railway.app/api/health

# Feed API
curl https://xtrix-backend-production-xxxx.up.railway.app/api/videos/feed?page=1&limit=5

# Live streams
curl https://xtrix-backend-production-xxxx.up.railway.app/api/live/active
```

### Test E2E (Frontend → Backend)
1. Deschide https://xtrix.app în browser
2. Check Network tab (F12) → XHR requests
3. Verify API calls merg la Railway backend URL
4. Test signup/login flow
5. Test scroll, swipe, theme toggle

---

## 🐛 Troubleshooting

### Frontend Issues

**404 Errors on Routes:**
- Check `.htaccess` exists în `public_html/`
- Verify RewriteEngine On

**Blank Page:**
- Check browser console (F12) pentru errors
- Verify `REACT_APP_BACKEND_URL` e corect în `.env.production`
- Check că `static/` folder a fost uploaded complet

**CORS Errors:**
- Update Railway env: `CORS_ORIGINS=https://xtrix.app,https://www.xtrix.app`
- Restart Railway service

### Backend Issues

**502 Bad Gateway:**
- Check Railway logs: Dashboard → Logs
- Verify MONGO_URL e corect
- Check PORT variable e set

**Slow Response:**
- MongoDB Atlas region: Use Europe (Frankfurt)
- Railway plan: Upgrade la Hobby ($5/month) pentru better performance

---

## 📊 Final Checklist

- [ ] **GitHub:** ✅ Repo pushed (https://github.com/dmadalin29-cmd/xtrix-app)
- [ ] **Railway Backend:** Deploy via Dashboard → Get URL → Test `/api/health`
- [ ] **Frontend Build:** Update `.env.production` cu Railway URL → `yarn build`
- [ ] **Hostinger Upload:** Upload `build/` folder la `public_html/` via File Manager
- [ ] **`.htaccess`:** Create în `public_html/` pentru React Router
- [ ] **Test E2E:** https://xtrix.app loads → API calls work → Features functional
- [ ] **PWA Install:** "Add to Home Screen" works pe mobile
- [ ] **MongoDB:** Data persists (create test user → check Atlas dashboard)

---

## 🎯 Expected Result

**Frontend:** https://xtrix.app  
**Backend:** https://xtrix-backend-production-xxxx.up.railway.app  
**Database:** MongoDB Atlas (xtrix_production)

**All working:**
✅ Homepage loads cu "Xtrix" logo  
✅ API calls la Railway backend  
✅ Scroll snap smooth  
✅ Theme toggle works  
✅ PWA installable  
✅ Mobile UX perfect

---

## 📞 Need Help?

### FTP Connection Failed?
- Verify credentials în Hostinger Dashboard → FTP Accounts
- Try SFTP instead of FTP (port might be 22)
- Use Hostinger File Manager (browser-based, no FTP needed)

### Railway Deploy Failed?
- Check Railway logs pentru error messages
- Verify GitHub repo has `backend/` folder
- Ensure all env variables are set correctly

---

## 💡 Alternative: Use Emergent Deploy

**Easiest Option:**
1. Click "Deploy" button în Emergent chat
2. Emergent hosts both frontend + backend automatically
3. Get instant URL (ex: `https://xtrix.emergentagent.com`)
4. Later, add custom domain `xtrix.app` în Emergent settings

**Benefits:**
- Zero configuration
- Instant deployment
- Auto-scaling
- Built-in SSL
- No Railway/Hostinger complications

---

*Created: 2025-03-22 | Manual Deployment Guide*
