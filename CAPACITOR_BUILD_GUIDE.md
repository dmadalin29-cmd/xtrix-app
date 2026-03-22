# 📱 Xtrix - Native App Build Guide

## Capacitor Setup Complete ✅

Xtrix este acum pregătit pentru build-uri native iOS și Android!

---

## 🏗️ Build Instructions

### Prerequisites
- **iOS:** macOS cu Xcode 15+ instalat
- **Android:** Android Studio cu SDK 34+ instalat

---

### 📱 Build pentru Android (Google Play)

1. **Build frontend:**
   ```bash
   cd /app/frontend
   yarn build
   ```

2. **Sync Capacitor:**
   ```bash
   npx cap sync android
   ```

3. **Deschide Android Studio:**
   ```bash
   npx cap open android
   ```

4. **În Android Studio:**
   - Schimbă `applicationId` în `android/app/build.gradle` (linia ~7): `com.xtrix.app`
   - Setează `versionCode` și `versionName`
   - Update `android/app/src/main/res/values/strings.xml` cu "Xtrix"
   - Generate Signed APK: Build → Generate Signed Bundle/APK → APK
   - Alege keystore (create new sau existing)
   - Build Release APK

5. **Upload la Google Play Console:**
   - Create app în Play Console
   - Upload APK/AAB la Internal Testing
   - Complete Store Listing (description, screenshots, icons)
   - Submit for review

---

### 🍎 Build pentru iOS (App Store)

1. **Build frontend:**
   ```bash
   cd /app/frontend
   yarn build
   ```

2. **Sync Capacitor:**
   ```bash
   npx cap sync ios
   ```

3. **Deschide Xcode:**
   ```bash
   npx cap open ios
   ```

4. **În Xcode:**
   - Schimbă Bundle Identifier: `com.xtrix.app`
   - Setează versiune și build number
   - Adaugă Team (Apple Developer Account)
   - Update Display Name: "Xtrix"
   - Configure Signing & Capabilities:
     - ✅ Automatic Signing (needs Apple Developer account $99/year)
     - ✅ Push Notifications (optional pentru viitor)
     - ✅ Background Modes (optional pentru audio în background)

5. **Archive pentru App Store:**
   - Product → Archive
   - Upload la App Store Connect
   - Complete App Store metadata (description, screenshots, category: Social Networking)
   - Submit for review

---

## 🎨 App Assets Required

### Android
- **Adaptive Icon:** `android/app/src/main/res/mipmap-*/ic_launcher.png`
  - Sizes: 48×48, 72×72, 96×96, 144×144, 192×192
  - Background: Solid #ff0050 (Xtrix red)
  - Foreground: White "K" logo transparent PNG

- **Splash Screen:** `android/app/src/main/res/drawable/splash.png`
  - Size: 1920×1920px
  - Background: #000000
  - Center: Xtrix logo

### iOS
- **App Icon:** `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
  - Sizes: 20×20 → 1024×1024 (Xcode generate din 1024×1024)
  - Design: Gradient #ff0050 → #ff3366 cu "K" alb bold

- **Splash Screen:** `ios/App/App/Assets.xcassets/Splash.imageset/`
  - Sizes: 1×, 2×, 3× (universal)
  - Background: #000000
  - Center: Xtrix logo

---

## 🔧 Configuration Files

### capacitor.config.ts
```typescript
{
  appId: 'com.xtrix.app',
  appName: 'Xtrix',
  webDir: 'build',
  plugins: {
    SplashScreen: { launchShowDuration: 2000, backgroundColor: '#000000' },
    StatusBar: { style: 'dark', backgroundColor: '#000000' },
    Camera: { permissions: ['camera', 'photos'] }
  }
}
```

### package.json - Add scripts:
```json
"scripts": {
  "cap:build": "yarn build && npx cap sync",
  "cap:android": "yarn cap:build && npx cap open android",
  "cap:ios": "yarn cap:build && npx cap open ios"
}
```

---

## 📋 Pre-Launch Checklist

### Testing
- [ ] Test pe device real Android (≥ Android 9)
- [ ] Test pe device real iOS (≥ iOS 13)
- [ ] Test upload video din camera
- [ ] Test live streaming din mobil
- [ ] Test gift animations pe device
- [ ] Test PWA offline mode

### Store Listings
- [ ] App screenshots (5-8 per platform)
  - Feed scroll
  - Live stream viewing
  - Upload video
  - Profile page
  - Gift sending animation
- [ ] Feature graphic (Android: 1024×500)
- [ ] Promotional text (EN + RO)
- [ ] Privacy Policy URL
- [ ] Terms of Service URL
- [ ] Content rating questionnaire

### Legal
- [ ] Privacy Policy (GDPR compliance)
- [ ] Terms of Service
- [ ] Community Guidelines
- [ ] Age rating: 13+ (recomandat pentru social video)

---

## 🚀 Deployment

### Production API
În `/app/frontend/.env.production`:
```
REACT_APP_BACKEND_URL=https://api.xtrix.com
```

### Build Commands
```bash
# Android Release
yarn build
npx cap sync android
# Then in Android Studio: Build → Generate Signed Bundle/APK

# iOS Release
yarn build
npx cap sync ios
# Then in Xcode: Product → Archive → Distribute App
```

---

## 📊 Store Optimization

### Google Play Store
- **Category:** Social
- **Content Rating:** Teen (13+)
- **Target SDK:** 34 (Android 14)
- **Keywords:** video, social, live streaming, clips, moments, create, share

### App Store
- **Category:** Social Networking
- **Age Rating:** 13+ (Frequent/Intense Realistic Violence: NO, Mature/Suggestive Themes: NO)
- **Keywords:** video,social,live,streaming,clips,moments,create,viral,tiktok
- **Promotional Text:** "Descoperă momente virale, creează conținut unic, și conectează-te cu comunitatea Xtrix!"

---

## 🔍 Native Features Integrated

- ✅ **Status Bar:** Dark theme (#000000)
- ✅ **Splash Screen:** 2s cu logo Xtrix
- ✅ **Camera Access:** Pentru video upload
- ✅ **File System:** Pentru video storage
- ✅ **Deep Links:** `xtrix://` scheme pentru share
- ✅ **Safe Area:** iOS notch support
- ✅ **Orientation:** Portrait locked (TikTok-style)

---

## 💰 Costuri Estimate

- **Apple Developer:** $99/year (obligatoriu pentru App Store)
- **Google Play:** $25 one-time fee
- **Total first year:** $124

---

## 📝 Notes

- Build time: ~10-15 min per platform
- Review time: 1-2 zile (Google), 2-5 zile (Apple)
- Updates: instant pe Web, 1-3 zile review pentru native
- PWA: instant updates, no store approval needed

**Recomandare:** Lansează PWA ACUM pentru early adopters, apoi native apps după testare extensivă.

---

*Last updated: 2025-03-22*
