'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  TicketIcon,
  CubeIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  HomeIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { AppVersion } from './app-version';
import { useLanguage } from '@/contexts/language-context';
import { useSettings } from '@/contexts/settings-context';

const navigationKeys = [
  { key: 'dashboard', href: '/dashboard', icon: HomeIcon },
  { key: 'tickets', href: '/tickets', icon: TicketIcon },
  { key: 'returns', href: '/returns', icon: ArrowPathIcon },
  { key: 'inventory', href: '/inventory', icon: CubeIcon },
  { key: 'customers', href: '/customers', icon: UserGroupIcon },
  { key: 'settings', href: '/settings', icon: Cog6ToothIcon, adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useLanguage();
  const { companyLogo, companyName } = useSettings();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapse state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  // Save collapse state to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
  };

  const filteredNavigation = navigationKeys.filter(
    (item) => !item.adminOnly || session?.user?.role === 'ADMIN'
  );

  return (
    <div
      className={cn(
        'flex flex-col bg-white border-r border-gray-200 h-full transition-all duration-300 shadow-soft flex-shrink-0',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo and Toggle */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2.5">
            {companyLogo ? (
              <img
                src={companyLogo}
                alt="Company Logo"
                className="h-9 w-auto object-contain"
              />
            ) : (
              <div className="h-9 w-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-medium">
                <TicketIcon className="h-5 w-5 text-white" />
              </div>
            )}
            <span className="text-xl font-bold text-gray-900">{companyName}</span>
          </Link>
        )}
        {isCollapsed && (
          <Link href="/dashboard" className="mx-auto">
            {companyLogo ? (
              <img
                src={companyLogo}
                alt="Company Logo"
                className="h-9 w-auto object-contain"
              />
            ) : (
              <div className="h-9 w-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-medium">
                <TicketIcon className="h-5 w-5 text-white" />
              </div>
            )}
          </Link>
        )}
        <button
          onClick={toggleCollapse}
          className={cn(
            'p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors',
            isCollapsed && 'mx-auto'
          )}
          aria-label="Toggle sidebar"
        >
          {isCollapsed ? (
            <Bars3Icon className="h-5 w-5" />
          ) : (
            <XMarkIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 p-3">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const translatedName = t(item.key);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-soft'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                isCollapsed && 'justify-center'
              )}
              title={isCollapsed ? translatedName : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>{translatedName}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Version Info */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-t border-gray-200">
          <AppVersion />
        </div>
      )}
    </div>
  );
}
