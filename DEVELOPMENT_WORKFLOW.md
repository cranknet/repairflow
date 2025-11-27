# Development Workflow - Web & Android

This guide explains how to develop for both web and Android platforms simultaneously.

## Quick Start

### For Web Development
```bash
npm run dev
# App runs on http://localhost:3000
```

### For Android Development
```bash
npm run android:dev
# Starts Next.js server AND opens Android Studio
```

### Build for Both Platforms
```bash
npm run sync:all
# Builds Next.js app and syncs to Android
```

## Development Workflow

### 1. Make Changes
Edit any file in `src/` - changes will work on both platforms!

### 2. Test on Web
```bash
npm run dev
```
Open http://localhost:3000 in your browser

### 3. Test on Android

**IMPORTANT**: The Next.js server must be running for Android to work!

1. **Start the Next.js server** (in one terminal):
   ```bash
   npm run dev
   # OR for production build:
   npm run build
   npm start
   ```

2. **Configure the server URL** in `capacitor.config.ts`:
   - For Android Emulator: `url: 'http://10.0.2.2:3000'`
   - For Physical Device: `url: 'http://YOUR_COMPUTER_IP:3000'` (find IP with `ipconfig` on Windows)

3. **Sync to Android** (in another terminal):
   ```bash
   npm run cap:sync
   ```

4. **Open Android Studio**:
   ```bash
   npm run cap:open:android
   ```

5. **Run the app** in Android Studio:
   - Click "Run" to launch on emulator/device
   - The app will connect to your Next.js server

### 4. Sync Changes to Android
After making code changes:
1. **Build the app** (if needed):
   ```bash
   npm run build
   ```

2. **Sync to Android**:
   ```bash
   npm run cap:sync
   ```

3. **Restart the app** in Android Studio to see changes

**Quick command** (build + sync):
```bash
npm run sync:all
```

## Platform Detection

The app automatically detects the platform:

```typescript
import { isWeb, isMobile, isAndroid, isCapacitor } from '@/lib/platform';

if (isMobile()) {
  // Mobile-specific code
} else {
  // Web-specific code
}
```

## Platform-Specific Features

### Features That Work on Both
- ✅ All UI components
- ✅ Authentication
- ✅ Ticket management
- ✅ Customer management
- ✅ Inventory management
- ✅ Dashboard
- ✅ Settings

### Features That Are Platform-Specific

#### COM Port SMS (Web Only)
- COM port communication only works on desktop
- Mobile shows a message that it's not available
- Future: Can implement native Android SMS API

#### File Uploads
- Works on both platforms
- Mobile uses native file picker
- Web uses standard file input

#### Camera Access
- Works on both platforms
- Mobile uses native camera
- Web uses browser camera API

## Configuration

### Web Configuration
- Uses standard Next.js configuration
- API routes work normally
- No special setup needed

### Android Configuration
Edit `capacitor.config.ts`:

```typescript
server: {
  // For development
  url: 'http://10.0.2.2:3000', // Android emulator
  // url: 'http://YOUR_IP:3000', // Physical device
  cleartext: true,
  
  // For production
  // url: 'https://your-server.com',
}
```

## Hot Reload

### Web
- Next.js hot reload works automatically
- Changes reflect immediately

### Android
- After `npm run cap:sync`, changes appear
- **Restart the app** in Android Studio to see changes
- The app connects to your Next.js server, so server changes reflect immediately
- Client-side changes require rebuild and sync

## Building for Production

### Web
```bash
npm run build
npm start
```

### Android APK
```bash
npm run build:android
npx cap open android
# Then build APK in Android Studio
```

## Tips

1. **Always test on both platforms** - Some features behave differently
2. **Use platform detection** - For platform-specific features
3. **Sync regularly** - Run `npm run cap:sync` after major changes
4. **Check console** - Both web and Android have developer tools
5. **Network debugging** - Use Chrome DevTools for Android WebView debugging

## Troubleshooting

### Changes not appearing on Android
- Run `npm run cap:sync`
- Rebuild in Android Studio
- Clear app data and reinstall

### API not connecting on Android
- Check `capacitor.config.ts` server URL
- Ensure Next.js server is running
- For emulator: use `10.0.2.2:3000`
- For device: use your computer's IP

### Build errors
- Run `npm install` to ensure dependencies are updated
- Clear `.next` folder: `rm -rf .next`
- Clear Android build: In Android Studio, Build → Clean Project

