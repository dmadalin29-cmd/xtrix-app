# KdM - Mobile UX Guidelines

## 📱 Design Philosophy
**Mobile-First, TikTok-Inspired, Ultra-Modern**

User feedback: "pe telefon nu se vede bine nimic" → Toate paginile trebuie optimizate pentru mobil ca prioritate #1.

---

## 🎨 Design System Mobile

### Viewport Strategy
- Use `h-[100dvh]` instead of `h-screen` (iOS Safari bottom bar fix)
- Safe area insets: `pb-20` pentru bottom nav space
- Breakpoint: `lg:` pentru desktop (≥ 1024px)

### Layout Patterns

#### Full-Screen Video Pages (Feed, Live Viewer)
```jsx
<div className="h-[100dvh] w-full relative">
  <video className="absolute inset-0 object-cover" />
  {/* Overlays absolute positioned on top */}
</div>
```

#### Standard Pages (Discover, Profile)
```jsx
<div className="min-h-[100dvh] pb-20 lg:pb-0">
  {/* Content cu safe area pentru bottom nav */}
</div>
```

### Navigation
- **Mobile (< 1024px):** Bottom nav bar (5 tabs)
  - For You, Discover, LIVE, Upload, Profile
  - Fixed bottom-0, z-50
  - Active indicator: red line top + text color #ff0050
  - Glassmorphic: `rgba(0,0,0,0.95)` + `backdrop-blur-40px`
- **Desktop (≥ 1024px):** Left sidebar (280px)
  - Navigation items + Suggested accounts
  - Sticky position

---

## 🎬 CRITICAL: Live Stream Viewer Mobile Design

### ❌ OLD DESIGN (BROKEN)
```
┌─────────────────────────────┐
│ Video (70%)  │ Chat (30%)  │ ← Prea înghesuit!
│              │ Gifts       │
└─────────────────────────────┘
```

### ✅ NEW DESIGN (OVERLAY)
```
┌─────────────────────────────┐
│ 🎥 VIDEO FULL-SCREEN       │
│    (absolute inset-0)       │
│                             │
│ [@avatar] User  [👁 1.2K] [X]│ ← Top bar absolute
│                             │
│                        👤   │ ← Action stack
│                        ❤️   │   bottom-right
│                        💬   │
│ ┌──────────────┐       🎁   │ ← Floating gift
│ │ Chat overlay │            │
│ │ (bottom-left)│            │
│ │ fade gradient│            │
│ └──────────────┘            │
│ [💬 Spune ceva...]          │ ← Input absolute bottom
└─────────────────────────────┘
```

### Overlay Specs

#### Top Bar (Absolute top-0)
- Broadcaster info: avatar + username + Follow button (left)
- Viewer count: 👁 count (center-right)
- Close button: X (right)
- Height: ~56px
- Background: `linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)`
- Safe-area-inset-top pentru iPhone notch

#### Chat Overlay (Absolute bottom-left)
- Width: 70% (max-w-sm)
- Height: max-h-[35vh]
- Messages fără background (doar text-shadow pentru readability)
- Gradient mask: `mask-image: linear-gradient(to bottom, transparent, black 15%, black)`
- Scroll automat la ultimul mesaj

#### Chat Input (Absolute bottom)
- Width: 70%
- Left: 16px, bottom: safe-area-inset + 16px
- Transparent pill: `rgba(255,255,255,0.1)` + blur
- Placeholder: "Spune ceva..."

#### Action Stack (Absolute bottom-right)
- Vertical flex column
- Items:
  1. Profile avatar (creator)
  2. Like button (heart)
  3. Share button
- Right: 16px, bottom: 100px
- Spacing: gap-4

#### Floating Gift Button (Absolute bottom-right)
- Below action stack
- Width/Height: 56x56px
- Gold glow animation (pulse)
- Icon: 🎁 Gift
- Right: 16px, bottom: safe-area-inset + 24px
- On tap → opens Gift Drawer

#### Gift Drawer (Bottom Sheet)
- Framer Motion drag="y" dragConstraints
- Height: 50vh
- Background: `rgba(15,15,25,0.95)` + `backdrop-blur-xl`
- Header: User coin balance (gold) + "Trimite Cadou" title + X close
- Grid: 4 columns × 5 rows (toate cele 20 cadouri)
- Each gift: icon + name + cost
- Send button: fixed bottom, full width

---

## 📄 Page-Specific Mobile Guidelines

### Feed Page
- **Layout:** snap-y snap-mandatory (swipe vertical)
- **Video:** h-[100dvh], snap-start
- **Action stack:** Right side (Like, Comment, Share, Bookmark, Profile)
- **Description:** Bottom-left overlay cu gradient
- **Stories:** Horizontal scroll top (după header)

### Discover Page
- **Hashtags:** Grid 2 columns pe mobil, horizontal scroll pe foarte small screens
- **Creators:** Horizontal scroll
- **Videos:** Grid 2 columns (aspect-[9/14])

### Profile Page
- **Header:** Stats row (Videos, Followers, Following) - responsive
- **Videos grid:** 3 columns fără gap (gap-0.5)
- **Tabs:** Videos, Liked (horizontal)

### Live Streams Directory
- **Grid:** 1 column pe very small, 2 columns pe ≥ 390px
- **Cards:** rounded-2xl cu glassmorphism
- **Badge:** "LIVE" roșu cu dot animat

---

## 🎯 Touch Targets
- **Minimum:** 44x44px pentru toate butoanele
- **Preferred:** 48x48px pentru primary actions
- **Spacing:** gap-4 (16px) între actions

## 🎨 Text Shadows for Readability
Text peste video MUST have shadow:
```css
text-shadow: 0 2px 8px rgba(0,0,0,0.8)
```

## ⚡ Performance Mobile
- Lazy load videos off-screen
- Compress images (quality=20 pentru thumbnails)
- Optimize animations (use transform, opacity - avoid width/height)
- Service Worker cache pentru assets

---

## 📊 Testing Checklist Mobile

### Screen Sizes to Test
- [ ] 360px (Android small)
- [ ] 375px (iPhone SE)
- [ ] 390px (iPhone 14)
- [ ] 430px (iPhone 14 Pro Max)
- [ ] 768px (iPad Mini)
- [ ] 820px (iPad)

### Features to Validate
- [ ] Bottom nav visible și functional
- [ ] Sidebar ascuns complet
- [ ] Content full-width (no sidebar margin)
- [ ] Touch targets ≥ 44px
- [ ] Text readable peste video
- [ ] Modals nu depășesc viewport
- [ ] Scroll smooth
- [ ] Chat overlay nu blochează action buttons

---

*Last updated: 2025-03-22 13:09*