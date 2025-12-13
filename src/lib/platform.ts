/**
 * Platform detection utility
 * Simplified for Web-only version
 */

export function isCapacitor(): boolean {
  return false;
}

export function isAndroid(): boolean {
  return false;
}

export function isIOS(): boolean {
  return false;
}

export function isWeb(): boolean {
  return true;
}

export function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Get the API base URL based on platform
 */
export function getApiBaseUrl(): string {
  // In web browser, use relative URLs (same origin)
  return '';
}

