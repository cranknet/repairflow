'use client';

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

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - Navigation Rail/Drawer */}
      {session && <Sidebar />}
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Header - App Bar */}
        {session && <TopHeader />}
        
        {/* Main Content - Scrollable area */}
        <main 
          className="flex-1 overflow-y-auto bg-background p-6" 
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
