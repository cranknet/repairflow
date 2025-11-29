# RepairFlow Windows Desktop App

This guide explains how to run, build, and distribute RepairFlow as a Windows desktop application using Electron.

## Overview

RepairFlow can run as both a web application and a native Windows desktop application. The Electron version:
- Wraps the Next.js application in a native window
- Automatically starts and stops the Next.js server
- Provides system-level integrations
- Supports both local (SQLite) and remote (MySQL) databases
- Allows users to switch between database configurations via UI

## Development

### Running in Development Mode

To run the desktop app in development mode with hot reload:

```powershell
npm run dev:electron
```

This command:
1. Starts the Next.js development server
2. Waits for it to be ready
3. Launches the Electron window

The Next.js dev server should already be running or you can run it separately with `npm run dev`.

### File Structure

```
repairflow/
├── electron/
│   ├── main.js          # Main Electron process
│   └── preload.js       # Preload script for IPC
├── server.js            # Next.js production server
├── electron-builder.json # Build configuration
└── package.json         # Scripts and dependencies
```

## Building for Production

### 1. Build the Application

Build the Next.js app:

```powershell
npm run build:electron
```

### 2. Create Windows Installer

Create distributable packages:

```powershell
npm run electron:dist
```

This creates:
- **NSIS Installer** (.exe) - Full installer with install wizard
- **Portable Version** (.exe) - Standalone executable

Output files are in the `dist` folder.

## Features

### Automatic Server Management

The Electron app automatically:
- Starts the Next.js server when launched
- Terminates the server when the app closes
- Handles graceful shutdown of all processes

### Database Switcher

Users can switch between:
- **Local SQLite**: Single-user, offline database
- **Remote MySQL**: Multi-user, network database

To access:
1. Open Settings
2. Click "Database" tab
3. Select database type
4. Configure connection (for MySQL)
5. Test connection
6. Save configuration
7. Restart the application

### System Integration

- Windows taskbar and system tray support
- Custom application icon
- Auto-start capability (optional)
- File associations (optional)

## Database Configuration

### SQLite (Default)

SQLite database is stored in:
```
C:\Users\<Username>\AppData\Roaming\RepairFlow\prisma\repairflow.db
```

### MySQL

Configure MySQL through the Database tab in Settings or manually in `.env`:

```env
DATABASE_URL="mysql://user:password@localhost:3306/repairflow"
```

After changing the database:
1. Restart the application
2. Run migrations: `npm run db:push`

## Distribution

### Installing on User Machines

**Option 1: NSIS Installer**
- Double-click `RepairFlow-Setup-1.5.2.exe`
- Follow installation wizard
- Creates desktop shortcuts
- Adds to Start Menu
- Includes uninstaller

**Option 2: Portable**
- Download `RepairFlow-1.5.2-portable.exe`
- Run directly without installation
- Store on USB drive for portability

### System Requirements

- Windows 10 or later (64-bit)
- 4GB RAM minimum
- 500MB free disk space
- .NET Framework 4.7.2 or later

## Troubleshooting

### App Won't Start

1. Check if port 3000 is available
2. Look for errors in console
3. Run in development mode to see detailed logs:
   ```powershell
   npm run dev:electron
   ```

### Database Issues

1. Verify database connection in Settings → Database tab
2. Check environment variables in `.env`
3. For MySQL: ensure server is running and accessible
4. Reset database:
   ```powershell
   npm run db:reset
   ```

### Build Errors

1. Clear build cache:
   ```powershell
   Remove-Item -Recurse -Force .next, dist, node_modules
   npm install
   ```

2. Rebuild:
   ```powershell
   npm run electron:dist
   ```

### Server Doesn't Stop

If the Next.js server doesn't terminate when closing the app:
1. Open Task Manager
2. End `node.exe` processes
3. Report the issue on GitHub

## Advanced Configuration

### Custom Port

Change the port in `electron/main.js`:

```javascript
const port = process.env.PORT || 3000;
```

### DevTools

DevTools are enabled in development mode. To enable in production, modify `electron/main.js`:

```javascript
mainWindow.webContents.openDevTools();
```

### Auto-Start on Windows Boot

Users can enable auto-start through Windows Settings:
1. Press `Win + R`
2. Type `shell:startup`
3. Create shortcut to RepairFlow.exe

## Development Notes

### IPC Communication

The preload script exposes safe APIs to the renderer:

```javascript
// In renderer (React components)
if (typeof window !== 'undefined' && window.electron) {
  const appPath = await window.electron.getAppPath();
  const dbPath = await window.electron.getDatabasePath();
}
```

### Environment Variables

Set `ELECTRON_ENV=true` to enable Electron-specific features in API routes.

## Known Issues

- First launch may take longer due to database initialization
- Window size/position not persisted between sessions
- No auto-update mechanism configured

## Future Enhancements

- [ ] Auto-update functionality
- [ ] System tray with quick actions
- [ ] Remember window size/position
- [ ] Offline mode detection
- [ ] Background data sync for MySQL
- [ ] Print directly to system printer
- [ ] Native notifications

## Support

For issues specific to the desktop app:
1. Check this documentation
2. Review [GitHub Issues](https://github.com/cranknet/repairflow/issues)
3. Create a new issue with:
   - Windows version
   - App version
   - Steps to reproduce
   - Error logs (if any)
