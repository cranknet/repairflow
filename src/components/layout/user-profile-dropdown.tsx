'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { ProfileSettingsModal } from './profile-settings-modal';

export function UserProfileDropdown() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!session) return null;

  const userInitials = session.user.name
    ? session.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : session.user.username
        .slice(0, 2)
        .toUpperCase();

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  const handleProfileSettings = () => {
    setShowProfileModal(true);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-soft">
          {userInitials}
        </div>
        <div className="text-left hidden md:block">
          <p className="text-sm font-semibold text-gray-900">
            {session.user.name || session.user.username}
          </p>
          <p className="text-xs text-gray-600">
            {session.user.role}
          </p>
        </div>
        <ChevronDownIcon
          className={`h-4 w-4 text-gray-600 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                {userInitials}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {session.user.name || session.user.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {session.user.email || session.user.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {session.user.role}
                </p>
              </div>
            </div>
          </div>

          <div className="py-2">
            <button
              onClick={handleProfileSettings}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Cog6ToothIcon className="h-5 w-5" />
              Profile Settings
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      )}

      <ProfileSettingsModal
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          // Trigger session update to refresh UI
          if (session) {
            // The session will be updated by the modal, but we can force a refresh
            window.dispatchEvent(new Event('session-update'));
          }
        }}
      />
    </div>
  );
}

