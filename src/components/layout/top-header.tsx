'use client';

import { SearchBars } from './search-bars';
import { NotificationsBell } from '@/components/notifications/notifications-bell';
import { LanguageSwitcher } from './language-switcher';
import { UserProfileDropdown } from './user-profile-dropdown';

/**
 * Material Design 3 Top App Bar Component
 * 
 * Implements MD3 top app bar with surface tint, proper elevation,
 * and accessibility features.
 * 
 * @see https://m3.material.io/components/top-app-bar/overview
 */

export function TopHeader() {
  return (
    <header 
      className="bg-surface border-b border-outline-variant shadow-md-level0 sticky top-0 z-40 transition-all duration-short2 ease-standard"
      role="banner"
    >
      <div className="flex items-center gap-4 h-16 px-6">
        {/* Search Bar - Left aligned */}
        <div className="flex-1 max-w-2xl">
          <SearchBars />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right Side Actions - Properly sized touch targets (min 48x48px) */}
        <div className="flex items-center gap-2" role="toolbar" aria-label="App actions">
          <LanguageSwitcher />
          <NotificationsBell />
          <div className="h-8 w-px bg-outline-variant mx-1" aria-hidden="true" />
          <UserProfileDropdown />
        </div>
      </div>
    </header>
  );
}
