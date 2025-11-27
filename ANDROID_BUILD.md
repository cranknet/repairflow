# Building Android APK for RepairShop

This guide explains how to build and deploy the RepairShop app as an Android APK.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Java JDK** (11 or higher)
3. **Android Studio** with Android SDK
4. **Next.js Server** running (the app needs API routes)

## Important Notes

⚠️ **This app uses Next.js API routes which require a server**. The mobile app will connect to your Next.js server. You have two options:

### Option 1: Development (Local Server)
- Run Next.js server on your computer
- Connect Android app to your local IP or emulator

### Option 2: Production (Deployed Server)
- Deploy Next.js app to a server (Vercel, AWS, etc.)
- Update `capacitor.config.ts` with your server URL

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Build Next.js App

```bash
npm run build
npm start
```

The server should be running on `http://localhost:3000`

### 3. Configure Capacitor for Your Environment

Edit `capacitor.config.ts`:

**For Android Emulator:**
```typescript
server: {
  url: 'http://10.0.2.2:3000',
  cleartext: true,
}
```

**For Physical Device (replace with your computer's IP):**
```typescript
server: {
  url: 'http://192.168.1.100:3000', // Your computer's local IP
  cleartext: true,
}
```

**For Production (deployed server):**
```typescript
server: {
  url: 'https://your-server.com',
  androidScheme: 'https',
}
```

### 4. Sync Capacitor

```bash
npm run cap:sync
```

### 5. Open Android Studio

```bash
npm run cap:open:android
```

### 6. Build APK in Android Studio

1. Open Android Studio
2. Wait for Gradle sync to complete
3. Go to **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
4. Or use **Build** → **Generate Signed Bundle / APK** for release builds

The APK will be generated in: `android/app/build/outputs/apk/`

## Quick Build Command

```bash
npm run android:build
```

This will:
1. Build the Next.js app
2. Sync with Capacitor
3. Open Android Studio

## Features That Won't Work on Mobile

- **COM Port SMS**: Serial port communication is not available on Android. You'll need to:
  - Use Android SMS API instead
  - Or disable SMS features on mobile
  - Or use a cloud SMS service

## Troubleshooting

### App can't connect to server
- Check that Next.js server is running
- Verify the URL in `capacitor.config.ts`
- For physical device, ensure phone and computer are on same network
- Check firewall settings

### Build errors
- Ensure Android SDK is installed
- Check Java JDK version (should be 11+)
- Run `npm run cap:sync` after any changes

### API routes not working
- Remember: API routes need a Next.js server
- Static export won't work with this app
- You must deploy the Next.js app separately

## Production Deployment

1. **Deploy Next.js app** to a server (Vercel, AWS, etc.)
2. **Update `capacitor.config.ts`** with production URL
3. **Build APK** with production configuration
4. **Sign the APK** for release
5. **Distribute** via Google Play Store or direct download

## Alternative: Separate Backend API

If you want a true offline mobile app, you would need to:
1. Convert API routes to a separate backend (Express, FastAPI, etc.)
2. Use Capacitor SQLite plugin for local database
3. Implement offline sync
4. This requires significant refactoring

