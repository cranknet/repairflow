// App version - synced with package.json
export const APP_VERSION = '1.3.0';
export const APP_NAME = 'RepairFlow';

// Version info
export interface VersionInfo {
  version: string;
  name: string;
  buildDate?: string;
  commitHash?: string;
}

export function getVersionInfo(): VersionInfo {
  return {
    version: APP_VERSION,
    name: APP_NAME,
    buildDate: process.env.NEXT_PUBLIC_BUILD_DATE,
    commitHash: process.env.NEXT_PUBLIC_COMMIT_HASH,
  };
}

// Compare versions (semantic versioning)
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  
  return 0;
}

// Check if version is newer
export function isNewerVersion(current: string, latest: string): boolean {
  return compareVersions(latest, current) > 0;
}

