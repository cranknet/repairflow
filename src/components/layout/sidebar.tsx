'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { AppVersion } from './app-version';
import { useLanguage } from '@/contexts/language-context';
import { useSettings } from '@/contexts/settings-context';

/**
 * Material Design 3 Navigation Rail/Drawer Component
 * 
 * Implements MD3 navigation patterns with proper state layers,
 * active indicators, and accessibility features.
 * Fully responsive with mobile overlay and tablet auto-collapse.
 * 
 * @see https://m3.material.io/components/navigation-rail/overview
 * @see https://m3.material.io/components/navigation-drawer/overview
 */

// Navigation items with Material Symbols icons
const navigationKeys = [
  {
    key: 'dashboard',
    href: '/dashboard',
    icon: 'dashboard',
    iconFilled: 'dashboard'
  },
  {
    key: 'tickets',
    href: '/tickets',
    icon: 'confirmation_number',
    iconFilled: 'confirmation_number'
  },
  {
    key: 'returns',
    href: '/returns',
    icon: 'sync_alt',
    iconFilled: 'sync_alt'
  },
  {
    key: 'customers',
    href: '/customers',
    icon: 'group',
    iconFilled: 'group'
  },
  {
    key: 'settings',
    href: '/settings',
    icon: 'settings',
    iconFilled: 'settings',
    adminOnly: true
  },
];

interface SidebarProps {
  mobileMenuOpen?: boolean;
  onMobileMenuClose?: () => void;
}

export function Sidebar({ mobileMenuOpen = false, onMobileMenuClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useLanguage();
  const { companyLogo, companyName } = useSettings();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Detect screen size for auto-collapse behavior
  useEffect(() => {
    setIsMounted(true);

    const handleResize = () => {
      const width = window.innerWidth;

      // On tablet and desktop (768px+), restore user preference
      if (width >= 768) {
        const saved = localStorage.getItem('sidebar-collapsed');
        if (saved !== null) {
          setIsCollapsed(JSON.parse(saved));
        } else {
          setIsCollapsed(false); // Default to expanded
        }
      }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load collapse state from localStorage (tablet/desktop)
  useEffect(() => {
    if (window.innerWidth >= 768) {
      const saved = localStorage.getItem('sidebar-collapsed');
      if (saved !== null) {
        setIsCollapsed(JSON.parse(saved));
      } else {
        setIsCollapsed(false); // Default to expanded
      }
    }
  }, []);

  // Save collapse state to localStorage (tablet/desktop)
  const toggleCollapse = () => {
    // Only allow manual toggle on tablet/desktop
    if (window.innerWidth >= 768) {
      const newState = !isCollapsed;
      setIsCollapsed(newState);
      localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
    }
  };

  // Close mobile menu when navigating
  const handleNavClick = () => {
    if (window.innerWidth < 768 && onMobileMenuClose) {
      onMobileMenuClose();
    }
  };

  const filteredNavigation = navigationKeys.filter((item) => {
    if (item.adminOnly && session?.user?.role !== 'ADMIN') {
      return false;
    }
    if ('roles' in item && Array.isArray(item.roles) && !item.roles.includes(session?.user?.role || '')) {
      return false;
    }
    return true;
  });

  // Don't render until mounted to avoid hydration issues
  if (!isMounted) {
    return null;
  }

  const sidebarContent = (
    <div
      className={cn(
        'flex flex-col bg-surface border-r border-outline-variant h-full transition-all duration-medium2 ease-emphasized shadow-md-level0 flex-shrink-0',
        // Mobile: full width when open, hidden when closed
        'md:relative',
        // Tablet/Desktop: responsive width
        isCollapsed ? 'w-20' : 'w-72'
      )}
    >
      {/* Logo and Toggle */}
      <div className="border-b border-outline-variant">
        <div className="flex items-center justify-between px-4 h-16">
          {!isCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-3 flex-1 min-w-0" onClick={handleNavClick}>
              {companyLogo ? (
                <Image
                  src={companyLogo}
                  alt="Company Logo"
                  width={40}
                  height={40}
                  className="object-contain flex-shrink-0 rounded-lg"
                  unoptimized
                />
              ) : (
                <Image
                  src="/default-logo.png"
                  alt="RepairFlow Logo"
                  width={40}
                  height={40}
                  className="object-contain flex-shrink-0 rounded-lg"
                  unoptimized
                />
              )}
              <span className="text-title-large text-on-surface truncate">{companyName}</span>
            </Link>
          )}
          {/* Only show toggle on tablet/desktop */}
          <button
            onClick={toggleCollapse}
            className={cn(
              'p-2 rounded-full text-on-surface-variant transition-all duration-short2 ease-standard md-state-layer-hover',
              'hover:bg-on-surface/8 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary',
              'hidden md:block',
              isCollapsed && 'mx-auto'
            )}
            aria-label="Toggle sidebar"
            aria-expanded={!isCollapsed}
          >
            <span className="material-symbols-outlined text-2xl">
              {isCollapsed ? 'menu_open' : 'menu'}
            </span>
          </button>
          {/* Close button on mobile */}
          <button
            onClick={onMobileMenuClose}
            className={cn(
              'p-2 rounded-full text-on-surface-variant transition-all duration-short2 ease-standard md-state-layer-hover',
              'hover:bg-on-surface/8 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary',
              'md:hidden'
            )}
            aria-label="Close menu"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 p-3" aria-label="Main navigation">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const translatedName = t(item.key);

          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={handleNavClick}
              className={cn(
                'relative flex items-center gap-3 rounded-full text-label-large font-medium transition-all duration-short2 ease-standard group overflow-hidden',
                'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2',
                // Ensure touch-friendly size on mobile (min 44px)
                'min-h-[44px]',
                isCollapsed ? 'justify-center h-14 w-14 mx-auto' : 'px-6 py-4',
                isActive
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'text-on-surface-variant hover:bg-on-surface/8'
              )}
              title={isCollapsed ? translatedName : undefined}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active indicator */}
              {isActive && !isCollapsed && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-on-secondary-container rounded-r-full" />
              )}

              {/* Icon */}
              <span
                className={cn(
                  'material-symbols-outlined text-2xl flex-shrink-0',
                  isActive && 'material-symbols-rounded font-bold'
                )}
                style={{
                  fontVariationSettings: isActive
                    ? "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24"
                    : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"
                }}
              >
                {item.icon}
              </span>

              {/* Label */}
              {!isCollapsed && (
                <span className="flex-1 truncate">
                  {translatedName}
                </span>
              )}

              {/* State layer for hover/press */}
              <div className="absolute inset-0 bg-on-surface opacity-0 group-hover:opacity-8 transition-opacity duration-short2 pointer-events-none rounded-full" />
            </Link>
          );
        })}
      </nav>

      {/* Version Info */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-t border-outline-variant">
          <AppVersion />
        </div>
      )}

      {/* Collapsed version indicator */}
      {isCollapsed && (
        <div className="px-2 py-3 border-t border-outline-variant flex justify-center">
          <div className="h-2 w-2 rounded-full bg-primary" title="App active" />
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile: Overlay sidebar */}
      <div className={cn(
        'fixed inset-0 z-50 md:hidden',
        mobileMenuOpen ? 'block' : 'hidden'
      )}>
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-scrim/50 backdrop-blur-sm"
          onClick={onMobileMenuClose}
          aria-hidden="true"
        />

        {/* Sidebar */}
        <div className={cn(
          'absolute left-0 top-0 bottom-0 w-72 transform transition-transform duration-medium2 ease-emphasized',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
          {sidebarContent}
        </div>
      </div>

      {/* Tablet/Desktop: Normal sidebar */}
      <div className="hidden md:block">
        {sidebarContent}
      </div>
    </>
  );
}
