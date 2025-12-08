'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './sidebar';
import { TopHeader } from './top-header';
import { useSession } from 'next-auth/react';

/**
 * Main Layout Component
 * 
 * Clean, modern layout with:
 * - Light sidebar on left
 * - Sticky header above content
 * - Proper spacing and overflow handling
 */

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleMobileMenuToggle = () => setMobileMenuOpen(!mobileMenuOpen);
  const handleMobileMenuClose = () => setMobileMenuOpen(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      {session && (
        <Sidebar
          mobileMenuOpen={mobileMenuOpen}
          onMobileMenuClose={handleMobileMenuClose}
        />
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Header */}
        {session && (
          <TopHeader onMobileMenuToggle={handleMobileMenuToggle} />
        )}

        {/* Scrollable Content */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ scrollbarGutter: 'stable' }}
          role="main"
        >
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
