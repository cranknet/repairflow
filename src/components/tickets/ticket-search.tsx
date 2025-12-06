'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/language-context';

export function TicketSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const pathname = usePathname();

  useEffect(() => {
    const currentSearch = searchParams.get('search') || '';
    if (search === currentSearch) {
      return;
    }

    const timer = setTimeout(() => {
      const params = new URLSearchParams();

      // Preserve existing status filter
      const status = searchParams.get('status');
      if (status) {
        params.set('status', status);
      }

      // Add search query
      if (search.trim()) {
        params.set('search', search.trim());
      }

      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.push(newUrl, { scroll: false });
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [search, router, searchParams, pathname]);

  const handleClear = () => {
    setSearch('');
    const params = new URLSearchParams();
    const status = searchParams.get('status');
    if (status) {
      params.set('status', status);
    }
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(newUrl, { scroll: false });
  };

  return (
    <div className="relative flex-1">
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
      <Input
        type="text"
        placeholder={t('searchByTicket')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="pl-10 pr-10"
      />
      {search && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

