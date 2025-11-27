'use client';

import { SearchBars } from './search-bars';
import { NotificationsBell } from '@/components/notifications/notifications-bell';
import { LanguageSwitcher } from './language-switcher';
import { UserProfileDropdown } from './user-profile-dropdown';

export function TopHeader() {
  return (
    <div className="bg-white border-b border-gray-200 shadow-soft">
      <div className="flex items-center gap-4 h-16 px-6">
        {/* Search Bar - Left aligned */}
        <div className="flex-1 max-w-xl">
          <SearchBars />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right Side Icons */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <NotificationsBell />
          <UserProfileDropdown />
        </div>
      </div>
    </div>
  );
}

