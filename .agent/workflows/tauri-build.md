---
description: Build Tauri desktop app with custom frontend URL
---

# Tauri Build Workflow

This workflow builds the Tauri desktop application with a configurable frontend URL.

## Steps

1. **Confirm the frontend URL** - Ask the user which URL the app should connect to:
   - `http://localhost:3000` - For development/local server
   - `https://your-domain.com` - For production deployment
   - Custom URL - Any other URL

2. **Update tauri.conf.json** - Modify the `frontendDist` value in `src-tauri/tauri.conf.json`

3. **Update CSP if needed** - If using a remote URL, update the Content Security Policy to allow that domain

4. **Run the build**:
   ```powershell
   npm run tauri:build
   ```

5. **Locate installers** - Built files will be in:
   - MSI: `src-tauri/target/release/bundle/msi/`
   - NSIS: `src-tauri/target/release/bundle/nsis/`

## Common URLs

| Environment | URL |
|-------------|-----|
| Local development | `http://localhost:3000` |
| Production | Update with your production domain |

## Notes

- For remote URLs, ensure the CSP in tauri.conf.json allows the domain
- The app requires internet connection when using remote URLs
- For localhost, ensure the Next.js server is running before launching the built app
