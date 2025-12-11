'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
}

interface CustomerSelectProps {
  customers: Customer[];
  value: string;
  onChange: (customerId: string) => void;
  error?: string;
  disabled?: boolean;
}

export function CustomerSelect({
  customers,
  value,
  onChange,
  error,
  disabled,
}: CustomerSelectProps) {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCustomer = customers.find((c) => c.id === value);

  // Use useMemo to derive filtered customers instead of setState in effect
  const filteredCustomers = useMemo(() => {
    if (search.trim()) {
      return customers.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.phone.includes(search) ||
          (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
      );
    }
    return customers.slice(0, 10); // Show first 10 when no search
  }, [search, customers]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (customer: Customer) => {
    onChange(customer.id);
    setSearch('');
    setShowDropdown(false);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleClear = () => {
    onChange('');
    setSearch('');
    setShowDropdown(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            id="customerId"
            ref={inputRef}
            type="text"
            value={search || selectedCustomer?.name || ''}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => {
              if (!selectedCustomer || search.trim()) {
                setShowDropdown(true);
              }
            }}
            placeholder={t('searchByNamePhoneOrEmail') || "Search by name, phone, or email..."}
            disabled={disabled}
            autoComplete="off"
            className="pl-10 pr-10"
          />
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
        {showDropdown && filteredCustomers.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredCustomers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => handleSelect(customer)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm border-b border-gray-200 dark:border-gray-700 last:border-b-0"
              >
                <div className="font-medium text-gray-900 dark:text-white">
                  {customer.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {customer.phone}
                  {customer.email && ` • ${customer.email}`}
                </div>
              </button>
            ))}
          </div>
        )}
        {showDropdown && search.trim() && filteredCustomers.length === 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg p-4 text-sm text-gray-500 dark:text-gray-400">
            No customers found
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

