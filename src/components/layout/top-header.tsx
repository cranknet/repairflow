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
 * Responsive top app bar with search, notifications, chat, and user actions.
 */

interface TopHeaderProps {
  onMobileMenuToggle?: () => void;
}

export function TopHeader({ onMobileMenuToggle }: TopHeaderProps) {
  const { t } = useLanguage();

  return (
    <header
      className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 transition-all shadow-theme-xs"
      role="banner"
    >
      <div className="flex items-center gap-2 sm:gap-4 h-16 px-3 sm:px-4">
        {/* Hamburger Menu - Mobile only */}
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 transition-colors"
          aria-label={t('header.openMenu')}
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

        {/* Search Bar - Left aligned */}
        <div className="flex-1 max-w-2xl">
          <SearchBars />
        </div>

        {/* Spacer - hidden on mobile */}
        <div className="hidden sm:flex flex-1" />

        {/* Right Side Actions */}
        <div className="flex items-center gap-1 sm:gap-2" role="toolbar" aria-label={t('header.appActions')}>
          <LanguageSwitcher />
          <InboxIcon />
          <ChatBell />
          <NotificationsBell />
          <div className="hidden sm:block h-8 w-px bg-gray-200 dark:bg-gray-700 mx-1" aria-hidden="true" />
          <UserProfileDropdown />
        </div>
      </div>
    </header>
  );
}
