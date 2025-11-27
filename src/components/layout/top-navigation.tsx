'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  TicketIcon,
  CubeIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { NotificationsBell } from '@/components/notifications/notifications-bell';
import { UserProfileDropdown } from './user-profile-dropdown';
import { SearchBars } from './search-bars';
import { HomeIcon } from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Tickets', href: '/tickets', icon: TicketIcon },
  { name: 'Inventory', href: '/inventory', icon: CubeIcon },
  { name: 'Customers', href: '/customers', icon: UserGroupIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, adminOnly: true },
];

export function TopNavigation() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const filteredNavigation = navigation.filter(
    (item) => !item.adminOnly || session?.user?.role === 'ADMIN'
  );

  return (
    <div className="bg-white border-b border-gray-200 shadow-soft">
      {/* Main Navigation Bar */}
      <div className="flex items-center justify-between h-16 px-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="h-9 w-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-medium">
            <TicketIcon className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">RepairFlow</span>
        </Link>

        {/* Navigation Menu */}
        <nav className="flex items-center gap-1">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-medium'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Side Icons */}
        <div className="flex items-center gap-4">
          <NotificationsBell />
          <UserProfileDropdown />
        </div>
      </div>

      {/* Search Bars */}
      <div className="bg-gray-50 border-t border-gray-100 px-6 py-3">
        <SearchBars />
      </div>
    </div>
  );
}

