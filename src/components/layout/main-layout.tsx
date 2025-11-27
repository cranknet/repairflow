'use client';

import { Sidebar } from './sidebar';
import { TopHeader } from './top-header';
import { useSession } from 'next-auth/react';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      {session && <Sidebar />}
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden ml-6 mr-6">
        {/* Top Header */}
        {session && <TopHeader />}
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50" style={{ scrollbarGutter: 'stable' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

