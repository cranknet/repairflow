'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/language-context';

export function CustomerSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [search, setSearch] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (search.trim()) {
        params.set('search', search.trim());
      }
      const newUrl = search.trim() ? `/customers?${params.toString()}` : '/customers';
      router.push(newUrl);
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [search, router]);

  const handleClear = () => {
    setSearch('');
    router.push('/customers');
  };

  return (
    <div className="relative flex-1">
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
      <Input
        type="text"
        placeholder={t('searchByCustomer')}
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
