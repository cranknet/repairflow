'use client';

import { useState, useEffect, useMemo } from 'react';
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
import {
  Squares2X2Icon,
  TicketIcon,
  WalletIcon,
  CurrencyDollarIcon,
  ReceiptRefundIcon,
  ShoppingCartIcon,
  UsersIcon,
  TruckIcon,
  ArchiveBoxIcon,
  BuildingStorefrontIcon,
  AdjustmentsHorizontalIcon,
  Cog6ToothIcon,
  Bars3Icon,
  ChevronLeftIcon,
  XMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import {
  Squares2X2Icon as Squares2X2IconSolid,
  TicketIcon as TicketIconSolid,
  WalletIcon as WalletIconSolid,
  CurrencyDollarIcon as CurrencyDollarIconSolid,
  ReceiptRefundIcon as ReceiptRefundIconSolid,
  ShoppingCartIcon as ShoppingCartIconSolid,
  UsersIcon as UsersIconSolid,
  TruckIcon as TruckIconSolid,
  ArchiveBoxIcon as ArchiveBoxIconSolid,
  BuildingStorefrontIcon as BuildingStorefrontIconSolid,
  AdjustmentsHorizontalIcon as AdjustmentsHorizontalIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  UserGroupIcon as UserGroupIconSolid,
} from '@heroicons/react/24/solid';
import type { ComponentType, SVGProps } from 'react';

/**
 * Navigation Sidebar Component
 * 
 * Modern, clean sidebar with:
 * - Light background by default
 * - Collapsible to icons-only (64px)
 * - Hover tooltips when collapsed
 * - Refined active state indicators
 */

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

interface NavigationChild {
  key: string;
  href: string;
  icon: HeroIcon;
  iconFilled: HeroIcon;
}

interface NavigationItem {
  key: string;
  href: string;
  icon: HeroIcon;
  iconFilled: HeroIcon;
  adminOnly?: boolean;
  requiresFeature?: string;
  roles?: string[];
  children?: NavigationChild[];
}

// Navigation items with Heroicons
const navigationKeys: NavigationItem[] = [
  {
    key: 'dashboard',
    href: '/dashboard',
    icon: Squares2X2Icon,
    iconFilled: Squares2X2IconSolid
  },
  {
    key: 'tickets',
    href: '/tickets',
    icon: TicketIcon,
    iconFilled: TicketIconSolid
  },
  {
    key: 'finance',
    href: '/finance',
    icon: WalletIcon,
    iconFilled: WalletIconSolid,
    adminOnly: true,
    requiresFeature: FEATURES.FINANCE_MODULE,
    children: [
      {
        key: 'finance.payments',
        href: '/finance/payments',
        icon: CurrencyDollarIcon,
        iconFilled: CurrencyDollarIconSolid
      },
      {
        key: 'finance.refunds',
        href: '/finance/refunds',
        icon: ReceiptRefundIcon,
        iconFilled: ReceiptRefundIconSolid
      },
      {
        key: 'finance.expenses',
        href: '/finance/expenses',
        icon: ShoppingCartIcon,
        iconFilled: ShoppingCartIconSolid
      },
    ]
  },
  {
    key: 'relations',
    href: '/customers',
    icon: UsersIcon,
    iconFilled: UsersIconSolid,
    children: [
      {
        key: 'relations.customers',
        href: '/customers',
        icon: UserGroupIcon,
        iconFilled: UserGroupIconSolid
      },
      {
        key: 'relations.suppliers',
        href: '/suppliers',
        icon: TruckIcon,
        iconFilled: TruckIconSolid
      }
    ]
  },
  {
    key: 'inventory',
    href: '/inventory/stock',
    icon: ArchiveBoxIcon,
    iconFilled: ArchiveBoxIconSolid,
    children: [
      {
        key: 'inventory.stock',
        href: '/inventory/stock',
        icon: BuildingStorefrontIcon,
        iconFilled: BuildingStorefrontIconSolid
      },
      {
        key: 'inventory.adjustments',
        href: '/inventory/inventory-adjustments',
        icon: AdjustmentsHorizontalIcon,
        iconFilled: AdjustmentsHorizontalIconSolid
      }
    ]
  },
  {
    key: 'settings',
    href: '/settings',
    icon: Cog6ToothIcon,
    iconFilled: Cog6ToothIconSolid,
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

  useEffect(() => {
    setIsMounted(true);

    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 768) {
        const saved = localStorage.getItem('sidebar-collapsed');
        if (saved !== null) {
          const shouldBeCollapsed = JSON.parse(saved);
          setIsCollapsed((prev: boolean) => prev !== shouldBeCollapsed ? shouldBeCollapsed : prev);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredNavigation = useMemo(() => navigationKeys.filter((item) => {
    if (item.adminOnly && session?.user?.role !== 'ADMIN') return false;
    if ('roles' in item && Array.isArray(item.roles) && !item.roles.includes(session?.user?.role || '')) return false;
    if ('requiresFeature' in item && item.requiresFeature) {
      if (item.requiresFeature === FEATURES.FINANCE_MODULE || item.requiresFeature === 'finance_module') {
        if (!isFinanceModuleEnabled) return false;
      }
    }
    return true;
  }), [session?.user?.role, isFinanceModuleEnabled]);

  // Auto-expand parent items when child route is active
  useEffect(() => {
    const activeParents = new Set<string>();
    filteredNavigation.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some(
          (child) => pathname === child.href || pathname.startsWith(child.href + '/')
        );
        if (hasActiveChild) activeParents.add(item.key);
      }
    });
    if (activeParents.size > 0) {
      setExpandedItems((prev) => new Set([...prev, ...activeParents]));
    }
  }, [pathname, filteredNavigation]);

  const toggleCollapse = () => {
    if (window.innerWidth >= 768) {
      const newState = !isCollapsed;
      setIsCollapsed(newState);
      localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
    }
  };

  const handleNavClick = () => {
    if (window.innerWidth < 768 && onMobileMenuClose) {
      onMobileMenuClose();
    }
  };

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

  if (!isMounted) return null;

  const sidebarContent = (
    <div
      className={cn(
        'flex flex-col h-full transition-all duration-300 flex-shrink-0',
        // Light background with subtle right border
        'bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800',
        // Responsive width
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo Header */}
      <div className="h-16 flex items-center border-b border-gray-100 dark:border-gray-800">
        <div className={cn(
          'flex items-center w-full',
          isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
        )}>
          {isCollapsed ? (
            // Collapsed: Menu button to expand
            <button
              onClick={toggleCollapse}
              className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
              aria-label={t('sidebar.expand')}
              title={t('sidebar.expand')}
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
          ) : (
            // Expanded: Full logo + name
            <Link href="/dashboard" className="flex items-center gap-3 flex-1 min-w-0" onClick={handleNavClick}>
              {companyLogo ? (
                <Image
                  src={companyLogo}
                  alt={t('sidebar.companyLogoAlt')}
                  width={36}
                  height={36}
                  className="object-contain flex-shrink-0 rounded-lg"
                  unoptimized
                />
              ) : (
                <Image
                  src="/default-logo.png"
                  alt={t('sidebar.logoAlt')}
                  width={36}
                  height={36}
                  className="object-contain flex-shrink-0 rounded-lg"
                  unoptimized
                />
              )}
              <span className="text-base font-semibold text-gray-900 dark:text-white truncate">
                {companyName}
              </span>
            </Link>
          )}

          {/* Toggle button - Desktop only, only when expanded */}
          {!isCollapsed && (
            <button
              onClick={toggleCollapse}
              className="hidden md:flex p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors items-center justify-center"
              aria-label={t('sidebar.collapse')}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
          )}

          {/* Mobile close button */}
          <button
            onClick={onMobileMenuClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors md:hidden"
            aria-label={t('sidebar.close')}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2" aria-label={t('sidebar.mainNavigation')}>
        <ul className="flex flex-col gap-1">
          {filteredNavigation.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const hasActiveChild = hasChildren
              ? item.children!.some((child) => pathname === child.href || pathname.startsWith(child.href + '/'))
              : false;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/') || hasActiveChild;
            const isExpanded = expandedItems.has(item.key) || hasActiveChild;
            const translatedName = t(item.key);

            const IconComponent = isActive ? item.iconFilled : item.icon;

            return (
              <li key={item.key}>
                {hasChildren ? (
                  // Parent with children
                  <div className="relative group">
                    <div className={cn(
                      'flex items-center rounded-lg transition-all duration-200',
                      isCollapsed ? 'justify-center' : 'gap-3 px-3',
                      isActive && !isCollapsed
                        ? 'bg-primary/10 text-primary dark:bg-primary/20'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                    )}>
                      <Link
                        href={item.href}
                        onClick={handleNavClick}
                        className={cn(
                          'flex items-center flex-1 py-2.5 rounded-lg transition-colors',
                          isCollapsed ? 'justify-center w-12 h-12' : 'gap-3'
                        )}
                        title={isCollapsed ? translatedName : undefined}
                      >
                        {/* Active indicator */}
                        {isActive && !isCollapsed && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                        )}

                        <IconComponent className="h-[22px] w-[22px] flex-shrink-0" />

                        {!isCollapsed && (
                          <span className="text-sm font-medium truncate">{translatedName}</span>
                        )}
                      </Link>

                      {/* Expand toggle */}
                      {!isCollapsed && (
                        <button
                          onClick={(e) => toggleExpand(item.key, e)}
                          className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                          aria-label={isExpanded ? t('sidebar.collapse') : t('sidebar.expand')}
                        >
                          {isExpanded ? (
                            <ChevronUpIcon className="h-4 w-4" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Collapsed hover menu */}
                    {isCollapsed && (
                      <div className="absolute left-full top-0 ml-2 hidden group-hover:block z-50">
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-2 min-w-[180px]">
                          <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            {translatedName}
                          </div>
                          {item.children!.map((child) => {
                            const isChildActive = pathname === child.href || pathname.startsWith(child.href + '/');
                            const ChildIcon = isChildActive ? child.iconFilled : child.icon;
                            return (
                              <Link
                                key={child.key}
                                href={child.href}
                                onClick={handleNavClick}
                                className={cn(
                                  'flex items-center gap-2 px-3 py-2 text-sm transition-colors',
                                  isChildActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
                                )}
                              >
                                <ChildIcon className="h-[18px] w-[18px]" />
                                {t(child.key)}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Expanded children */}
                    {!isCollapsed && isExpanded && (
                      <ul className="mt-1 ml-9 flex flex-col gap-0.5">
                        {item.children!.map((child) => {
                          const isChildActive = pathname === child.href || pathname.startsWith(child.href + '/');
                          const ChildIcon = isChildActive ? child.iconFilled : child.icon;
                          return (
                            <li key={child.key}>
                              <Link
                                href={child.href}
                                onClick={handleNavClick}
                                className={cn(
                                  'relative flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors',
                                  isChildActive
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                                )}
                              >
                                <ChildIcon className="h-[18px] w-[18px]" />
                                {t(child.key)}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ) : (
                  // Simple nav item
                  <Link
                    href={item.href}
                    onClick={handleNavClick}
                    className={cn(
                      'relative flex items-center rounded-lg transition-all duration-200 group',
                      isCollapsed ? 'justify-center w-12 h-12 mx-auto' : 'gap-3 px-3 py-2.5',
                      isActive
                        ? 'bg-primary/10 text-primary dark:bg-primary/20'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                    )}
                    title={isCollapsed ? translatedName : undefined}
                  >
                    {/* Active indicator */}
                    {isActive && !isCollapsed && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                    )}

                    <IconComponent className="h-[22px] w-[22px] flex-shrink-0" />

                    {!isCollapsed && (
                      <span className="text-sm font-medium truncate">{translatedName}</span>
                    )}

                    {/* Tooltip for collapsed */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                        {translatedName}
                      </div>
                    )}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className={cn(
        'border-t border-gray-100 dark:border-gray-800',
        isCollapsed ? 'p-2' : 'px-4 py-3'
      )}>
        {isCollapsed ? (
          <div className="flex justify-center">
            <div className="h-2 w-2 rounded-full bg-primary" title={t('sidebar.appActive')} />
          </div>
        ) : (
          <AppVersion />
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      <div className={cn('fixed inset-0 z-50 md:hidden', mobileMenuOpen ? 'block' : 'hidden')}>
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onMobileMenuClose}
          aria-hidden="true"
        />
        <div className={cn(
          'absolute left-0 top-0 bottom-0 w-64 transform transition-transform duration-300',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
          {sidebarContent}
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        {sidebarContent}
      </div>
    </>
  );
}
