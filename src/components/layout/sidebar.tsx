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
import { useFeatureFlag } from '@/lib/hooks/useFeatureFlag';
import { FEATURES } from '@/lib/features';

/**
 * Navigation Sidebar Component
 * 
 * Responsive navigation with proper state layers,
 * active indicators, and accessibility features.
 * Fully responsive with mobile overlay and tablet auto-collapse.
 */

interface NavigationChild {
  key: string;
  href: string;
  icon: string;
  iconFilled: string;
}

interface NavigationItem {
  key: string;
  href: string;
  icon: string;
  iconFilled: string;
  adminOnly?: boolean;
  requiresFeature?: string;
  roles?: string[];
  children?: NavigationChild[];
}

// Navigation items with Material Symbols icons
const navigationKeys: NavigationItem[] = [
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
    key: 'finance',
    href: '/finance',
    icon: 'account_balance_wallet',
    iconFilled: 'account_balance_wallet',
    adminOnly: true,
    requiresFeature: FEATURES.FINANCE_MODULE, // Feature flag
    children: [
      {
        key: 'finance.payments',
        href: '/finance/payments',
        icon: 'payments',
        iconFilled: 'payments'
      },
      {
        key: 'finance.refunds',
        href: '/finance/refunds',
        icon: 'receipt_long',
        iconFilled: 'receipt_long'
      },
      {
        key: 'finance.expenses',
        href: '/finance/expenses',
        icon: 'shopping_cart',
        iconFilled: 'shopping_cart'
      },

    ]
  },
  {
    key: 'relations',
    href: '/customers',
    icon: 'contacts',
    iconFilled: 'contacts',
    children: [
      {
        key: 'relations.customers',
        href: '/customers',
        icon: 'group',
        iconFilled: 'group'
      },
      {
        key: 'relations.suppliers',
        href: '/suppliers',
        icon: 'local_shipping',
        iconFilled: 'local_shipping'
      }
    ]
  },
  {
    key: 'inventory',
    href: '/inventory/stock',
    icon: 'inventory_2',
    iconFilled: 'inventory_2',
    children: [
      {
        key: 'inventory.stock',
        href: '/inventory/stock',
        icon: 'warehouse',
        iconFilled: 'warehouse'
      },
      {
        key: 'inventory.adjustments',
        href: '/inventory/inventory-adjustments',
        icon: 'tune',
        iconFilled: 'tune'
      }
    ]
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
  const isFinanceModuleEnabled = useFeatureFlag(FEATURES.FINANCE_MODULE);
  // Initialize collapsed state from localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      const saved = localStorage.getItem('sidebar-collapsed');
      if (saved !== null) {
        return JSON.parse(saved);
      }
    }
    return false;
  });

  const [isMounted, setIsMounted] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Detect screen size for auto-collapse behavior
  useEffect(() => {
    setIsMounted(true);

    const handleResize = () => {
      const width = window.innerWidth;

      // On tablet and desktop (768px+), restore user preference if not already set
      if (width >= 768) {
        const saved = localStorage.getItem('sidebar-collapsed');
        if (saved !== null) {
          // Only update if different to avoid loop
          const shouldBeCollapsed = JSON.parse(saved);
          setIsCollapsed((prev: boolean) => prev !== shouldBeCollapsed ? shouldBeCollapsed : prev);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-expand parent items when child route is active
  useEffect(() => {
    const activeParents = new Set<string>();
    filteredNavigation.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some(
          (child) => pathname === child.href || pathname.startsWith(child.href + '/')
        );
        if (hasActiveChild) {
          activeParents.add(item.key);
        }
      }
    });
    if (activeParents.size > 0) {
      setExpandedItems((prev) => new Set([...prev, ...activeParents]));
    }
  }, [pathname]);

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
    // Check feature flag requirement
    if ('requiresFeature' in item && item.requiresFeature) {
      // For finance module, check the feature flag
      if (
        item.requiresFeature === FEATURES.FINANCE_MODULE ||
        item.requiresFeature === 'finance_module' // Backward compatibility
      ) {
        if (!isFinanceModuleEnabled) {
          return false;
        }
      }
      // Future feature flags can be added here
    }
    return true;
  });

  // Toggle expand/collapse for items with children
  const toggleExpand = (key: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Don't render until mounted to avoid hydration issues
  if (!isMounted) {
    return null;
  }

  const sidebarContent = (
    <div
      className={cn(
        'flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-full transition-all duration-300 flex-shrink-0',
        // Mobile: full width when open, hidden when closed
        'md:relative',
        // Tablet/Desktop: responsive width
        isCollapsed ? 'w-20' : 'w-72'
      )}
    >
      {/* Logo and Toggle */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 h-16">
          {!isCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-3 flex-1 min-w-0" onClick={handleNavClick}>
              {companyLogo ? (
                <Image
                  src={companyLogo}
                  alt={t('sidebar.companyLogoAlt')}
                  width={40}
                  height={40}
                  className="object-contain flex-shrink-0 rounded-lg"
                  unoptimized
                />
              ) : (
                <Image
                  src="/default-logo.png"
                  alt={t('sidebar.logoAlt')}
                  width={40}
                  height={40}
                  className="object-contain flex-shrink-0 rounded-lg"
                  unoptimized
                />
              )}
              <span className="text-lg font-semibold text-gray-900 dark:text-white truncate">{companyName}</span>
            </Link>
          )}
          {/* Only show toggle on tablet/desktop */}
          <button
            onClick={toggleCollapse}
            className={cn(
              'p-2 rounded-lg text-gray-500 dark:text-gray-400 transition-colors',
              'hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-gray-300',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
              'hidden md:block',
              isCollapsed && 'mx-auto'
            )}
            aria-label={t('sidebar.toggle')}
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
              'p-2 rounded-lg text-gray-500 dark:text-gray-400 transition-colors',
              'hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-gray-300',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
              'md:hidden'
            )}
            aria-label={t('sidebar.close')}
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 p-4" aria-label="Main navigation">
        {filteredNavigation.map((item) => {
          const hasChildren = item.children && item.children.length > 0;
          const hasActiveChild = hasChildren
            ? item.children!.some(
              (child) => pathname === child.href || pathname.startsWith(child.href + '/')
            )
            : false;
          const isActive =
            pathname === item.href ||
            pathname.startsWith(item.href + '/') ||
            hasActiveChild;
          const isExpanded = expandedItems.has(item.key) || hasActiveChild;
          const translatedName = t(item.key);

          return (
            <div key={item.key} className="flex flex-col gap-1">
              {/* Parent item */}
              {hasChildren ? (
                <button
                  onClick={(e) => toggleExpand(item.key, e)}
                  className={cn(
                    'relative flex items-center gap-3 rounded-lg text-sm font-medium transition-colors group overflow-hidden w-full',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                    'min-h-[44px]',
                    isCollapsed ? 'justify-center h-14 w-14 mx-auto' : 'px-3 py-2.5',
                    isActive
                      ? 'bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'
                  )}
                  title={isCollapsed ? translatedName : undefined}
                  aria-expanded={isExpanded}
                  aria-controls={`nav-children-${item.key}`}
                >
                  {/* Active indicator */}
                  {isActive && !isCollapsed && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-500 rounded-r-full" />
                  )}

                  {/* Icon */}
                  <span
                    className={cn(
                      'text-2xl flex-shrink-0',
                      isActive ? 'material-symbols-rounded font-bold' : 'material-symbols-outlined'
                    )}
                    style={{
                      fontVariationSettings: isActive
                        ? "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24"
                        : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"
                    }}
                  >
                    {isActive ? item.iconFilled : item.icon}
                  </span>

                  {/* Label */}
                  {!isCollapsed && (
                    <span className="flex-1 truncate text-left">
                      {translatedName}
                    </span>
                  )}

                  {/* Chevron icon for expand/collapse */}
                  {!isCollapsed && hasChildren && (
                    <span className="material-symbols-outlined text-xl flex-shrink-0 transition-transform duration-short2">
                      {isExpanded ? 'expand_more' : 'chevron_right'}
                    </span>
                  )}

                  {/* State layer for hover/press */}

                </button>
              ) : (
                <Link
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    'relative flex items-center gap-3 rounded-lg text-sm font-medium transition-colors group overflow-hidden',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                    'min-h-[44px]',
                    isCollapsed ? 'justify-center h-14 w-14 mx-auto' : 'px-3 py-2.5',
                    isActive
                      ? 'bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'
                  )}
                  title={isCollapsed ? translatedName : undefined}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* Active indicator */}
                  {isActive && !isCollapsed && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-500 rounded-r-full" />
                  )}

                  {/* Icon */}
                  <span
                    className={cn(
                      'text-2xl flex-shrink-0',
                      isActive ? 'material-symbols-rounded font-bold' : 'material-symbols-outlined'
                    )}
                    style={{
                      fontVariationSettings: isActive
                        ? "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24"
                        : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"
                    }}
                  >
                    {isActive ? item.iconFilled : item.icon}
                  </span>

                  {/* Label */}
                  {!isCollapsed && (
                    <span className="flex-1 truncate">
                      {translatedName}
                    </span>
                  )}

                  {/* State layer for hover/press */}

                </Link>
              )}

              {/* Children items */}
              {hasChildren && isExpanded && !isCollapsed && (
                <div
                  id={`nav-children-${item.key}`}
                  className="flex flex-col gap-1 pl-12"
                  role="group"
                  aria-label={`${translatedName} submenu`}
                >
                  {item.children!.map((child) => {
                    const isChildActive =
                      pathname === child.href || pathname.startsWith(child.href + '/');
                    const translatedChildName = t(child.key);

                    return (
                      <Link
                        key={child.key}
                        href={child.href}
                        onClick={handleNavClick}
                        className={cn(
                          'relative flex items-center gap-3 rounded-lg text-sm font-medium transition-colors group overflow-hidden',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                          'min-h-[40px] px-3 py-2',
                          isChildActive
                            ? 'bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400'
                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'
                        )}
                        aria-current={isChildActive ? 'page' : undefined}
                      >
                        {/* Active indicator */}
                        {isChildActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-brand-500 rounded-r-full" />
                        )}

                        {/* Icon */}
                        <span
                          className={cn(
                            'text-xl flex-shrink-0',
                            isChildActive
                              ? 'material-symbols-rounded font-bold'
                              : 'material-symbols-outlined'
                          )}
                          style={{
                            fontVariationSettings: isChildActive
                              ? "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24"
                              : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"
                          }}
                        >
                          {isChildActive ? child.iconFilled : child.icon}
                        </span>

                        {/* Label */}
                        <span className="flex-1 truncate">{translatedChildName}</span>

                        {/* State layer for hover/press */}

                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Version Info */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
          <AppVersion />
        </div>
      )}

      {/* Collapsed version indicator */}
      {isCollapsed && (
        <div className="px-2 py-3 border-t border-gray-200 dark:border-gray-800 flex justify-center">
          <div className="h-2 w-2 rounded-full bg-brand-500" title={t('sidebar.appActive')} />
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
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onMobileMenuClose}
          aria-hidden="true"
        />

        {/* Sidebar */}
        <div className={cn(
          'absolute left-0 top-0 bottom-0 w-72 transform transition-transform duration-300',
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
