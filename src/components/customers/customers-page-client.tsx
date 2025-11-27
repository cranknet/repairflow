'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CustomerSearch } from '@/components/customers/customer-search';
import { CustomersListHeader } from '@/components/customers/customers-list-header';
import { NoCustomersFound } from '@/components/customers/no-customers-found';
import { TranslatedCardTitle } from '@/components/layout/translated-card-title';
import { CustomersTable } from '@/components/customers/customers-table';
import { NewCustomerModal } from '@/components/customers/new-customer-modal';
import { useLanguage } from '@/contexts/language-context';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  createdAt: Date;
  _count: {
    tickets: number;
  };
}

interface CustomersPageClientProps {
  customers: Customer[];
  search?: string;
}

export function CustomersPageClient({ customers, search }: CustomersPageClientProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSuccess = (_customerId: string) => {
    router.refresh();
  };

  return (
    <>
      <div className="space-y-6 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('customers')}</h1>
            <p className="text-gray-600 dark:text-gray-400">{t('manageCustomers')}</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>{t('addCustomer')}</Button>
        </div>

        {/* Search Filter */}
        <Card>
          <CardHeader>
            <TranslatedCardTitle translationKey="searchCustomers" />
          </CardHeader>
          <CardContent>
            <CustomerSearch />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CustomersListHeader count={customers.length} searchQuery={search} />
          </CardHeader>
          <CardContent>
            {customers.length === 0 ? (
              <NoCustomersFound />
            ) : (
              <CustomersTable customers={customers} />
            )}
          </CardContent>
        </Card>
      </div>

      <NewCustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}

