'use client';

import { getVersionInfo } from '@/lib/version';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

export function AppVersion() {
  const versionInfo = getVersionInfo();

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
      <InformationCircleIcon className="h-4 w-4" />
      <span>
        {versionInfo.name} v{versionInfo.version}
        {versionInfo.buildDate && (
          <span className="ml-2 opacity-75">
            • Built {new Date(versionInfo.buildDate).toLocaleDateString()}
          </span>
        )}
      </span>
    </div>
  );
}

