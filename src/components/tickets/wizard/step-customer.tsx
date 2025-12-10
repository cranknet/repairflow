'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/language-context';
import { CustomerData } from '../new-ticket-wizard';
import {
  MagnifyingGlassIcon,
  UserPlusIcon,
  UserIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
}

interface StepCustomerProps {
  data: CustomerData;
  onChange: (data: CustomerData) => void;
}

export function StepCustomer({ data, onChange }: StepCustomerProps) {
  const { t } = useLanguage();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);

  // Fetch customers on mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/customers');
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) {
      return customers.slice(0, 20); // Show first 20 when no search
    }
    const query = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.phone.includes(query) ||
        (c.email && c.email.toLowerCase().includes(query))
    );
  }, [searchQuery, customers]);

  // Handle customer selection
  const handleSelectCustomer = (customer: Customer) => {
    onChange({
      customerId: customer.id,
      isNewCustomer: false,
      newCustomer: undefined,
    });
    setShowNewCustomerForm(false);
  };

  // Handle new customer form toggle
  const handleToggleNewCustomer = () => {
    const newShowForm = !showNewCustomerForm;
    setShowNewCustomerForm(newShowForm);

    if (newShowForm) {
      onChange({
        customerId: '',
        isNewCustomer: true,
        newCustomer: {
          name: '',
          phone: '',
          email: '',
          address: '',
          notes: '',
        },
      });
    } else {
      onChange({
        customerId: data.customerId,
        isNewCustomer: false,
        newCustomer: undefined,
      });
    }
  };

  // Handle new customer field changes
  const handleNewCustomerChange = (field: string, value: string) => {
    onChange({
      ...data,
      isNewCustomer: true,
      newCustomer: {
        ...data.newCustomer,
        [field]: value,
      } as CustomerData['newCustomer'],
    });
  };

  // Get selected customer
  const selectedCustomer = customers.find((c) => c.id === data.customerId);

  return (
    <div className="space-y-6">
      {/* Toggle between existing and new customer */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
        <Button
          type="button"
          variant={!showNewCustomerForm ? 'default' : 'outline'}
          onClick={() => showNewCustomerForm && handleToggleNewCustomer()}
          className="flex-1 py-4 sm:py-6 text-sm sm:text-base"
        >
          <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          {t('selectExistingCustomer')}
        </Button>
        <Button
          type="button"
          variant={showNewCustomerForm ? 'default' : 'outline'}
          onClick={() => !showNewCustomerForm && handleToggleNewCustomer()}
          className="flex-1 py-4 sm:py-6 text-sm sm:text-base"
        >
          <UserPlusIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          {t('createNewCustomerInline')}
        </Button>
      </div>

      {/* Existing Customer Selection */}
      {!showNewCustomerForm && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchCustomerPlaceholder')}
              className="pl-10"
            />
          </div>

          {/* Selected Customer Display */}
          {selectedCustomer && (
            <Card className="border-primary-500 bg-primary-50 dark:bg-primary-900/20">
              <CardContent className="p-4 flex items-center gap-4">
                <CheckCircleIcon className="w-6 h-6 text-primary-600" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedCustomer.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedCustomer.phone}
                    {selectedCustomer.email && ` • ${selectedCustomer.email}`}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange({ ...data, customerId: '' })}
                >
                  {t('change')}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Customer List */}
          {!selectedCustomer && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-[300px] overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">
                  {t('loading')}...
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {searchQuery ? t('noCustomersFound') : t('noCustomers')}
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => handleSelectCustomer(customer)}
                      className={`
                        w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800
                        transition-colors flex items-center gap-4
                        ${data.customerId === customer.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
                      `}
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {customer.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {customer.phone}
                          {customer.email && ` • ${customer.email}`}
                        </p>
                      </div>
                      {data.customerId === customer.id && (
                        <CheckCircleIcon className="w-5 h-5 text-primary-600 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Show more hint */}
          {!selectedCustomer && filteredCustomers.length >= 20 && !searchQuery && (
            <p className="text-center text-sm text-gray-500">
              {t('searchToFindMore')}
            </p>
          )}
        </div>
      )}

      {/* New Customer Form */}
      {showNewCustomerForm && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="newCustomerName"
                label={`${t('customerName')} *`}
                value={data.newCustomer?.name || ''}
                onChange={(e) => handleNewCustomerChange('name', e.target.value)}
                placeholder={t('customers.placeholder.name')}
                autoFocus
              />
              <Input
                id="newCustomerPhone"
                label={`${t('customerPhone')} *`}
                value={data.newCustomer?.phone || ''}
                onChange={(e) => handleNewCustomerChange('phone', e.target.value)}
                placeholder={t('customers.placeholder.phone')}
              />
            </div>

            <Input
              id="newCustomerEmail"
              label={t('customerEmail')}
              type="email"
              value={data.newCustomer?.email || ''}
              onChange={(e) => handleNewCustomerChange('email', e.target.value)}
              placeholder={t('customers.placeholder.email')}
            />

            <Input
              id="newCustomerAddress"
              label={t('customerAddress')}
              value={data.newCustomer?.address || ''}
              onChange={(e) => handleNewCustomerChange('address', e.target.value)}
              placeholder={t('customers.placeholder.address')}
            />

            <Textarea
              id="newCustomerNotes"
              label={t('notes')}
              value={data.newCustomer?.notes || ''}
              onChange={(e) => handleNewCustomerChange('notes', e.target.value)}
              placeholder={t('customers.placeholder.notes')}
              rows={2}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

