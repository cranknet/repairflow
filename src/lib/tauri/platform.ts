/**
 * Platform Detection Utilities
 *
 * Detects whether the app is running inside Tauri or as a web app.
 */

/**
 * Check if running inside Tauri desktop app
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Check if running as a desktop app (alias for isTauri)
 */
export function isDesktop(): boolean {
  return isTauri();
}

/**
 * Check if running as a web app
 */
export function isWeb(): boolean {
  return !isTauri();
}

/**
 * Get the current platform
 */
export function getPlatform(): 'tauri' | 'web' {
  return isTauri() ? 'tauri' : 'web';
}

/**
 * Get the operating system (only available in Tauri)
 */
export async function getOS(): Promise<string | null> {
  if (!isTauri()) return null;
  
  try {
    const { platform } = await import('@tauri-apps/plugin-os');
    return platform();
  } catch {
    return null;
  }
}
