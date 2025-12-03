'use client';

import { useLanguage } from '@/contexts/language-context';
import { SearchBars } from './search-bars';
import { NotificationsBell } from '@/components/notifications/notifications-bell';
import { InboxIcon } from '@/components/contact/inbox-icon';
import { LanguageSwitcher } from './language-switcher';
import { UserProfileDropdown } from './user-profile-dropdown';

/**
 * Material Design 3 Top App Bar Component
 * 
 * Implements MD3 top app bar with surface tint, proper elevation,
 * accessibility features, and responsive mobile menu.
 * 
 * @see https://m3.material.io/components/top-app-bar/overview
 */

interface TopHeaderProps {
  onMobileMenuToggle?: () => void;
}

export function TopHeader({ onMobileMenuToggle }: TopHeaderProps) {
  const { t } = useLanguage();

  return (
    <header
      className="bg-surface border-b border-outline-variant shadow-md-level0 sticky top-0 z-40 transition-all duration-short2 ease-standard"
      role="banner"
    >
      <div className="flex items-center gap-2 sm:gap-4 h-16 px-3 sm:px-4">
        {/* Hamburger Menu - Mobile only */}
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 rounded-full text-on-surface-variant hover:bg-on-surface/8 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary transition-all duration-short2 ease-standard md-state-layer-hover"
          aria-label={t('header.openMenu')}
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>

        {/* Search Bar - Left aligned */}
        <div className="flex-1 max-w-2xl">
          <SearchBars />
        </div>

        {/* Spacer - hidden on mobile */}
        <div className="hidden sm:flex flex-1" />

        {/* Right Side Actions - Properly sized touch targets (min 44px) */}
        <div className="flex items-center gap-1 sm:gap-2" role="toolbar" aria-label={t('header.appActions')}>
          <LanguageSwitcher />
          <InboxIcon />
          <NotificationsBell />
          <div className="hidden sm:block h-8 w-px bg-outline-variant mx-1" aria-hidden="true" />
          <UserProfileDropdown />
        </div>
      </div>
    </header>
  );
}
