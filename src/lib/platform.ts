/**
 * Platform detection utility
 * Detects if running in Capacitor (mobile) or web browser
 */

export function isCapacitor(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).Capacitor;
}

export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  const capacitor = (window as any).Capacitor;
  return capacitor?.getPlatform() === 'android';
}

export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const capacitor = (window as any).Capacitor;
  return capacitor?.getPlatform() === 'ios';
}

export function isWeb(): boolean {
  return !isCapacitor();
}

export function isMobile(): boolean {
  return isCapacitor();
}

/**
 * Get the API base URL based on platform
 */
export function getApiBaseUrl(): string {
  if (isCapacitor()) {
    // In Capacitor, use the server URL from config or default to localhost
    // This should match your capacitor.config.ts server.url
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    return serverUrl;
  }
  // In web browser, use relative URLs (same origin)
  return '';
}

