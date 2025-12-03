'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/language-context';

interface Supplier {
  id: string;
  name: string;
}

interface PartsStockSearchProps {
  suppliers: Supplier[];
}

export function PartsStockSearch({ suppliers }: PartsStockSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [supplierId, setSupplierId] = useState(searchParams.get('supplierId') || '');

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (search.trim()) {
        params.set('search', search.trim());
      }
      if (supplierId) {
        params.set('supplierId', supplierId);
      }
      const newUrl = params.toString() 
        ? `/inventory/stock?${params.toString()}` 
        : '/inventory/stock';
      router.push(newUrl);
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [search, supplierId, router]);

  const handleClear = () => {
    setSearch('');
    setSupplierId('');
    router.push('/inventory/stock');
  };

  const hasFilters = search.trim() || supplierId;

  return (
    <div className="flex gap-4">
      <div className="relative flex-1">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder={t('searchByInventory')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 pr-10"
        />
      </div>
      <select
        value={supplierId}
        onChange={(e) => setSupplierId(e.target.value)}
        className="w-64 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="">{t('allSuppliers')}</option>
        {suppliers.map((supplier) => (
          <option key={supplier.id} value={supplier.id}>
            {supplier.name}
          </option>
        ))}
      </select>
      {hasFilters && (
        <button
          type="button"
          onClick={handleClear}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <XMarkIcon className="h-5 w-5 inline mr-1" />
          {t('clear')}
        </button>
      )}
    </div>
  );
}

