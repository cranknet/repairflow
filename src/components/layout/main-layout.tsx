'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './sidebar';
import { TopHeader } from './top-header';
import { useSession } from 'next-auth/react';

/**
 * Material Design 3 Main Layout Component
 * 
 * Implements MD3 layout patterns with proper surface hierarchy,
 * elevation, and responsive behavior.
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

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - Navigation Rail/Drawer */}
      {session && (
        <Sidebar
          mobileMenuOpen={mobileMenuOpen}
          onMobileMenuClose={handleMobileMenuClose}
        />
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Header - App Bar */}
        {session && (
          <TopHeader
            onMobileMenuToggle={handleMobileMenuToggle}
          />
        )}

        {/* Main Content - Scrollable area */}
        <main
          className="flex-1 overflow-y-auto bg-background p-4 sm:p-6"
          style={{ scrollbarGutter: 'stable' }}
          role="main"
        >
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
