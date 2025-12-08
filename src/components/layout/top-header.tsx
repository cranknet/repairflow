'use client';

import { useLanguage } from '@/contexts/language-context';
import { SearchBars } from './search-bars';
import { NotificationsBell } from '@/components/notifications/notifications-bell';
import { ChatBell } from '@/components/chat/chat-bell';
import { InboxIcon } from '@/components/contact/inbox-icon';
import { LanguageSwitcher } from './language-switcher';
import { UserProfileDropdown } from './user-profile-dropdown';
import { Bars3Icon } from '@heroicons/react/24/outline';

/**
 * Top Header Component
 * 
 * Modern, clean header with:
 * - Sticky positioning
 * - Contained width matching content
 * - Subtle styling with refined shadows
 * - Always-visible search bar
 */

interface TopHeaderProps {
  onMobileMenuToggle?: () => void;
}

export function TopHeader({ onMobileMenuToggle }: TopHeaderProps) {
  const { t } = useLanguage();

  return (
    <header
      className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800"
      role="banner"
    >
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Left side */}
        <div className="flex items-center gap-3 flex-1">
          {/* Hamburger Menu - Mobile only */}
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
            aria-label={t('header.openMenu')}
          >
            <Bars3Icon className="h-5 w-5" />
          </button>

          {/* Search Bar - Always visible */}
          <div className="flex-1 max-w-xl">
            <SearchBars />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-1" role="toolbar" aria-label={t('header.appActions')}>
          <LanguageSwitcher />

          <div className="hidden sm:flex items-center gap-1">
            <InboxIcon />
            <ChatBell />
            <NotificationsBell />
          </div>

          {/* Divider */}
          <div className="hidden sm:block h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2" aria-hidden="true" />

          <UserProfileDropdown />
        </div>
      </div>
    </header>
  );
}
