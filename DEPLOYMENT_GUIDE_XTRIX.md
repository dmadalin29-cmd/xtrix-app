# 🚀 Xtrix - Production Deployment Guide

## Domain: https://xtrix.app

---

## 📋 Deployment Checklist

### 1. Environment Variables (Production)

Create `/app/frontend/.env.production`:
```env
REACT_APP_BACKEND_URL=https://api.xtrix.app
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
```

Create `/app/backend/.env.production`:
```env
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/
DB_NAME=xtrix_production
JWT_SECRET=your_super_secret_jwt_key_256_bits_minimum
FRONTEND_URL=https://xtrix.app
```

---

### 2. DNS Configuration

**Required DNS Records:**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | [Your_Server_IP] | 3600 |
| A | www | [Your_Server_IP] | 3600 |
| A | api | [Your_Server_IP] | 3600 |
| CNAME | www | xtrix.app | 3600 |

**Verify DNS:**
```bash
dig xtrix.app +short
dig api.xtrix.app +short
```

---

### 3. SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificates for both domains
sudo certbot --nginx -d xtrix.app -d www.xtrix.app -d api.xtrix.app

# Auto-renewal (runs every 12h)
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

### 4. Nginx Configuration

Create `/etc/nginx/sites-available/xtrix.app`:

```nginx
# Frontend - xtrix.app
server {
    listen 80;
    listen [::]:80;
    server_name xtrix.app www.xtrix.app;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name xtrix.app www.xtrix.app;

    ssl_certificate /etc/letsencrypt/live/xtrix.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/xtrix.app/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root /var/www/xtrix/frontend/build;
    index index.html;

    # PWA support
    location /manifest.json {
        add_header Cache-Control "public, max-age=604800";
    }

    location /sw.js {
        add_header Cache-Control "no-cache";
    }

    # React Router (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Backend - api.xtrix.app
server {
    listen 80;
    listen [::]:80;
    server_name api.xtrix.app;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.xtrix.app;

    ssl_certificate /etc/letsencrypt/live/xtrix.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/xtrix.app/privkey.pem;

    # CORS headers
    add_header Access-Control-Allow-Origin "https://xtrix.app" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
    add_header Access-Control-Allow-Credentials "true" always;

    location / {
        if ($request_method = 'OPTIONS') {
            return 204;
        }
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (pentru live chat viitor)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # HLS streaming support
    location /hls/ {
        alias /var/www/xtrix/hls_streams/;
        add_header Cache-Control "no-cache";
        add_header Access-Control-Allow-Origin "*";
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/xtrix.app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### 5. Build & Deploy

```bash
# Frontend
cd /app/frontend
yarn build
sudo rsync -av build/ /var/www/xtrix/frontend/build/

# Backend
cd /app/backend
pip install -r requirements.txt
sudo systemctl restart xtrix-backend

# Capacitor sync (pentru native builds)
cd /app/frontend
yarn cap:sync
```

---

### 6. Systemd Service (Backend)

Create `/etc/systemd/system/xtrix-backend.service`:

```ini
[Unit]
Description=Xtrix Backend API
After=network.target mongod.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/xtrix/backend
Environment="PATH=/usr/local/bin:/usr/bin:/bin"
EnvironmentFile=/var/www/xtrix/backend/.env.production
ExecStart=/usr/local/bin/uvicorn server:app --host 0.0.0.0 --port 8001 --workers 4
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable & start:
```bash
sudo systemctl enable xtrix-backend
sudo systemctl start xtrix-backend
sudo systemctl status xtrix-backend
```

---

### 7. MongoDB Atlas (Recommended for Production)

1. **Create Cluster:**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com/)
   - Create free M0 cluster (512MB, perfect pentru start)
   - Region: Europe (Frankfurt sau Amsterdam)

2. **Security:**
   - Database Access: Create user `xtrix_admin` (password strong)
   - Network Access: Add server IP + 0.0.0.0/0 (pentru Emergent preview)

3. **Connection String:**
   ```
   mongodb+srv://xtrix_admin:PASSWORD@cluster0.xxxxx.mongodb.net/
   ```
   Add to `backend/.env.production` ca `MONGO_URL`

---

### 8. CDN & Assets (Optional - Recommended)

**Cloudflare Setup:**
1. Add domain xtrix.app la Cloudflare
2. Update nameservers la registrar
3. Enable:
   - ✅ Auto HTTPS Rewrites
   - ✅ Brotli compression
   - ✅ Rocket Loader (pentru JS)
   - ✅ Mirage (image optimization)
4. Cache Rules:
   - Static assets (*.js, *.css, *.png): 1 year
   - API (api.xtrix.app): No cache
   - HTML: 1 hour

---

### 9. Monitoring & Analytics

**Backend Monitoring:**
```bash
# Install PM2 pentru process management
npm install -g pm2

# Start backend cu PM2
pm2 start "uvicorn server:app --host 0.0.0.0 --port 8001 --workers 4" --name xtrix-api
pm2 startup
pm2 save

# Monitor logs
pm2 logs xtrix-api
pm2 monit
```

**Frontend Analytics:**
- Add Google Analytics 4 în `public/index.html`
- Add Plausible Analytics (privacy-friendly alternative)

---

### 10. Performance Optimization

**Frontend:**
```bash
# Build optimizat
GENERATE_SOURCEMAP=false yarn build

# Verifică bundle size
yarn add -D webpack-bundle-analyzer
npm run build -- --stats
npx webpack-bundle-analyzer build/bundle-stats.json
```

**Backend:**
```bash
# Uvicorn cu Gunicorn (production)
pip install gunicorn
gunicorn server:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001
```

---

### 11. Backup Strategy

**MongoDB Daily Backup:**
```bash
# Cron job (daily 3 AM)
0 3 * * * mongodump --uri="$MONGO_URL" --out=/backups/xtrix-$(date +\%Y\%m\%d) --gzip

# Keep 30 days, delete older
find /backups/ -name "xtrix-*" -mtime +30 -delete
```

**Media Files Backup:**
- User uploaded videos: S3 bucket sau Cloudflare R2
- Auto-backup cu lifecycle policy (30 days retention)

---

### 12. Security Hardening

**Backend:**
- Rate limiting: 100 requests/min per IP
- CORS: Only allow https://xtrix.app
- JWT: Rotate secret every 90 days
- Input validation: Pydantic models (already implemented ✅)

**Frontend:**
- CSP Headers în Nginx:
  ```nginx
  add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com;";
  ```

---

### 13. Testing Production

**Smoke Tests:**
```bash
# Homepage
curl -I https://xtrix.app

# API health
curl https://api.xtrix.app/api/health

# Auth flow
curl -X POST https://api.xtrix.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Feed
curl https://api.xtrix.app/api/videos/feed?page=1&limit=10
```

**Load Testing:**
```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test 1000 requests, 50 concurrent
ab -n 1000 -c 50 https://api.xtrix.app/api/videos/feed?page=1&limit=10
```

---

### 14. Rollback Plan

**Quick Rollback:**
```bash
# Frontend
cd /var/www/xtrix/frontend
git checkout [previous_commit_hash]
yarn build
sudo rsync -av build/ /var/www/xtrix/frontend/build/

# Backend
cd /var/www/xtrix/backend
git checkout [previous_commit_hash]
sudo systemctl restart xtrix-backend
```

---

## 🎯 Go-Live Sequence

1. ✅ Build production frontend: `yarn build`
2. ✅ Deploy la server (rsync sau Emergent Deploy)
3. ✅ Configure Nginx cu SSL
4. ✅ Start backend service (systemd sau PM2)
5. ✅ Test smoke tests (curl API endpoints)
6. ✅ Monitor logs (first 30 min critical)
7. ✅ Test PWA install (Add to Home Screen)
8. ✅ Load test (100 concurrent users)
9. ✅ Announce launch! 🚀

---

## 🌐 Domain Propagation

După configurare DNS:
- **Immediate:** 5-10 minutes (local ISP)
- **Global:** 24-48 hours (complete propagation)
- **Check:** https://dnschecker.org

---

## 📱 App Store Submissions

### Google Play (xtrix.app native Android)
1. `yarn cap:android` → Open Android Studio
2. Change `applicationId` în `build.gradle`: `com.xtrix.app`
3. Generate Signed APK (keystore required)
4. Upload la Play Console: https://play.google.com/console
5. Store listing: "Xtrix - Social Video Platform"
6. Category: Social
7. Submit for review (1-2 zile)

### App Store (xtrix.app native iOS)
1. `yarn cap:ios` → Open Xcode
2. Change Bundle ID: `com.xtrix.app`
3. Add Apple Developer Team
4. Archive → Upload to App Store Connect
5. App Store listing: "Xtrix - Social Video Platform"
6. Category: Social Networking
7. Submit for review (2-5 zile)

---

## 💰 Estimated Costs

**Monthly (1000 active users):**
- MongoDB Atlas M10: $57/month (2GB storage, auto-scale)
- VPS (4 vCPU, 8GB RAM): $20-40/month (DigitalOcean, Hetzner)
- Cloudflare CDN: Free tier (100GB/month)
- Domain: ~$12/year (xtrix.app)
- SSL: Free (Let's Encrypt)

**One-Time:**
- Apple Developer: $99/year
- Google Play: $25 lifetime

**Total First Month:** ~$100-120  
**Total Monthly After:** ~$80-100

---

## 🎉 Launch Announcement Template

**Social Media Post:**
```
🚀 Xtrix e LIVE!

Descoperă o nouă platformă de video social: 
✨ Videos virale și creative
🔴 Live streaming interactiv
💬 Comunitate activă
🎁 Gift system pentru creators

👉 https://xtrix.app

#Xtrix #SocialVideo #LiveStreaming #CreateContent
```

---

*Last updated: 2025-03-22 | Production Ready*
