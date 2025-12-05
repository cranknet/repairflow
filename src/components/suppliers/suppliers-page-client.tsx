'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SupplierSearch } from '@/components/suppliers/supplier-search';
import { SuppliersListHeader } from '@/components/suppliers/suppliers-list-header';
import { NoSuppliersFound } from '@/components/suppliers/no-suppliers-found';
import { TranslatedCardTitle } from '@/components/layout/translated-card-title';
import { SuppliersTable } from '@/components/suppliers/suppliers-table';
import { SupplierFormModal } from '@/components/finance/SupplierFormModal';
import { useLanguage } from '@/contexts/language-context';

interface Supplier {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: Date;
  _count: {
    parts: number;
  };
}

interface SuppliersPageClientProps {
  suppliers: Supplier[];
  search?: string;
  userRole: string;
}

export function SuppliersPageClient({ suppliers, search, userRole }: SuppliersPageClientProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSuccess = (supplier?: { id: string; name: string }) => {
    router.refresh();
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="space-y-6 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('relations.suppliers')}</h1>
            <p className="text-gray-600 dark:text-gray-400">{t('manageSuppliers')}</p>
          </div>
          {userRole === 'ADMIN' && (
            <Button onClick={() => setIsModalOpen(true)}>{t('addSupplier')}</Button>
          )}
        </div>

        {/* Search Filter */}
        <Card>
          <CardHeader>
            <TranslatedCardTitle translationKey="searchSuppliers" />
          </CardHeader>
          <CardContent>
            <SupplierSearch />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SuppliersListHeader count={suppliers.length} searchQuery={search} />
          </CardHeader>
          <CardContent>
            {suppliers.length === 0 ? (
              <NoSuppliersFound />
            ) : (
              <SuppliersTable suppliers={suppliers} userRole={userRole} />
            )}
          </CardContent>
        </Card>
      </div>

      {isModalOpen && (
        <SupplierFormModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}

