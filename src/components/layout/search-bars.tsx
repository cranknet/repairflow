'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

type SearchType = 'all' | 'customer' | 'ticket';

export function SearchBars() {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('all');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchTypes: { value: SearchType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'customer', label: 'Customer' },
    { value: 'ticket', label: 'Ticket #' },
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
        // Try to intelligently route based on input
        // If it looks like a ticket number (starts with T or is numeric), search tickets
        // Otherwise, search customers first
        if (/^T\d+/i.test(searchValue) || /^\d+$/.test(searchValue)) {
          router.push(`/tickets?search=${encodeURIComponent(searchValue)}`);
        } else {
          router.push(`/customers?search=${encodeURIComponent(searchValue)}`);
        }
        break;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getPlaceholder = () => {
    switch (searchType) {
      case 'customer':
        return 'Search customers...';
      case 'ticket':
        return 'Search tickets...';
      case 'all':
      default:
        return 'Search customers or tickets...';
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowTypeDropdown(false);
      }
    };

    if (showTypeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTypeDropdown]);

  return (
    <div className="relative flex items-center w-full" ref={searchContainerRef}>
      {/* Search Type Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowTypeDropdown(!showTypeDropdown)}
          className="flex items-center gap-1.5 px-3 py-2 h-10 bg-gray-50 rounded-l-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10 transition-colors"
        >
          <span>{searchTypes.find((t) => t.value === searchType)?.label}</span>
          <ChevronDownIcon className="h-3.5 w-3.5" />
        </button>
        {showTypeDropdown && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowTypeDropdown(false)}
            />
            <div className="absolute top-full left-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
              {searchTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    setSearchType(type.value);
                    setShowTypeDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                    searchType === type.value ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Search Input */}
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="text"
          placeholder={getPlaceholder()}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full h-10 pl-10 pr-4 bg-gray-50 rounded-r-lg text-sm text-gray-900 placeholder-gray-500 border border-l-0 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
        />
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

