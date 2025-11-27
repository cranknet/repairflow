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
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Tickets', href: '/tickets', icon: TicketIcon },
  { name: 'Inventory', href: '/inventory', icon: CubeIcon },
  { name: 'Customers', href: '/customers', icon: UserGroupIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
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

  const filteredNavigation = navigation.filter(
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
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-medium">
              <TicketIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">RepairShop</span>
          </div>
        )}
        {isCollapsed && (
          <div className="h-9 w-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-medium mx-auto">
            <TicketIcon className="h-5 w-5 text-white" />
          </div>
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
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-soft'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                isCollapsed && 'justify-center'
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
