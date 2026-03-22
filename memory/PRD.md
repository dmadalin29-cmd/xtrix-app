# KdM (Klip de Moment) - Product Requirements Document

## Product Vision
Clonă 100% TikTok cu design ultra-modern dark theme + glassmorphic effects. Web + PWA pentru mobil.

## Core Features

### 1. Video Feed (TikTok-style)
- Vertical scroll infinite
- Auto-play cu sound
- Actions: Like, Comment, Share, Bookmark
- Stories bar sus
- Smart recommendation algorithm (engagement + popularity + recency)

### 2. Live Streaming
- **Broadcaster:** Go Live Studio cu stream key, FFmpeg push, HLS output
- **Viewer:** Full-screen player + chat + gifts
  - **MOBILE:** Chat overlay, floating gift button (PRIORITY 1)
  - **DESKTOP:** 70% video / 30% chat sidebar
- Real-time chat cu WebSocket-style updates
- Gift sending cu flying animations

### 3. Wallet System
- Virtual coins (monedă platform)
- Top-up cu Viva Payments (30% platform markup)
- Withdraw 1:1 ratio
- Transaction history
- Balance visible în Header

### 4. Gift System
- 20 cadouri (5 RON → 200 RON)
- 70% creator / 30% platform split
- Framer Motion flying animations
- Real-time în live chat

### 5. Social Features
- Follow/Unfollow creators
- Nested Comments cu replies
- DM Messages
- User Profiles (videos grid, stats)
- Hashtag pages
- Discover trending

### 6. Upload
- Video upload (drag-drop)
- Caption, hashtags, music
- Thumbnail auto-generate

### 7. Analytics Dashboard
- Creator stats (views, engagement, revenue)
- Charts cu date range

## Tech Stack
- **Frontend:** React 18, TailwindCSS, Framer Motion, HLS.js
- **Backend:** FastAPI, MongoDB (Motor), FFmpeg
- **Auth:** JWT tokens
- **Streaming:** HLS protocol

## Design System
- **Colors:** Primary #ff0050, Gold #FFD700, Accent #00f5d4
- **Fonts:** Unbounded (headings), Outfit (body)
- **Effects:** Glassmorphism (backdrop-blur-xl, rgba overlays, subtle borders)
- **Animations:** Framer Motion micro-interactions

## Responsive Strategy
- **Mobile (< 1024px):** Bottom navigation bar (5 tabs), no sidebar
- **Desktop (≥ 1024px):** Left sidebar, top header
- **PWA:** Manifest cu shortcuts, Service Worker cache

## User Flow Priority
1. Landing → Feed (smart algorithm)
2. Discover trending content
3. Watch Live streams (MOBILE UX CRITICAL)
4. Send gifts în live (overlay design)
5. Upload content
6. Build following

## Current Status (Fork 3)
- ✅ All core features implemented
- ✅ Desktop UX polished
- ✅ Mobile UX optimized (Bottom nav, overlay design, touch targets)
- ✅ Performance optimized (React.memo, GPU acceleration, 60fps)
- ✅ PWA Enhanced (manifest, service worker v2, installable)
- ✅ Native apps ready (Capacitor iOS/Android configured)
- ✅ Dark/Light mode (theme toggle functional)
- ⏳ **PENDING:** Viva Payments integration (needs API keys from user)

## Known Issues & Fixes
- ~~Sidebar overlap pe mobil~~ → FIXED (hidden lg:flex + bottom nav)
- ~~Live Viewer 70/30 split pe mobil~~ → IN PROGRESS (redesign cu overlay)

---
*Last updated: 2025-03-22*