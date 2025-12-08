'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/language-context';

type SearchType = 'all' | 'customer' | 'ticket';

export function SearchBars() {
  const router = useRouter();
  const { t } = useLanguage();
  const [searchValue, setSearchValue] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('all');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const searchTypes: { value: SearchType; label: string }[] = [
    { value: 'all', label: t('search.type.all') },
    { value: 'customer', label: t('search.type.customer') },
    { value: 'ticket', label: t('search.type.ticket') },
  ];

  const handleSearch = () => {
    if (!searchValue.trim()) return;

    switch (searchType) {
      case 'customer':
        router.push(`/customers?search=${encodeURIComponent(searchValue)}`);
        break;
      case 'ticket':
        router.push(`/tickets?search=${encodeURIComponent(searchValue)}`);
        break;
      case 'all':
      default:
        if (/^T\d+/i.test(searchValue) || /^\d+$/.test(searchValue)) {
          router.push(`/tickets?search=${encodeURIComponent(searchValue)}`);
        } else {
          router.push(`/customers?search=${encodeURIComponent(searchValue)}`);
        }
        break;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const getPlaceholder = () => {
    switch (searchType) {
      case 'customer':
        return t('search.placeholder.customer');
      case 'ticket':
        return t('search.placeholder.ticket');
      default:
        return t('search.placeholder.all');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowTypeDropdown(false);
      }
    };

    if (showTypeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTypeDropdown]);

  return (
    <div
      ref={searchContainerRef}
      className={`relative flex items-center transition-all duration-200 rounded-full ${isFocused
          ? 'bg-white ring-2 ring-primary/20 shadow-sm'
          : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
    >
      {/* Search Icon */}
      <MagnifyingGlassIcon className="absolute left-3 h-4 w-4 text-gray-400 pointer-events-none" />

      {/* Search Input */}
      <input
        type="text"
        placeholder={getPlaceholder()}
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onKeyPress={handleKeyPress}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-full h-9 pl-9 pr-24 bg-transparent rounded-full text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
      />

      {/* Search Type Dropdown */}
      <div className="absolute right-1">
        <button
          type="button"
          onClick={() => setShowTypeDropdown(!showTypeDropdown)}
          className="flex items-center gap-1 px-2.5 py-1 h-7 bg-gray-200/80 dark:bg-gray-700 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-300/80 dark:hover:bg-gray-600 transition-colors"
        >
          <span>{searchTypes.find((t) => t.value === searchType)?.label}</span>
          <ChevronDownIcon className="h-3 w-3" />
        </button>

        {showTypeDropdown && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowTypeDropdown(false)} />
            <div className="absolute top-full right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 overflow-hidden">
              {searchTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    setSearchType(type.value);
                    setShowTypeDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${searchType === type.value
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
