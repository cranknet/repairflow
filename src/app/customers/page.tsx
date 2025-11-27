import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CustomerSearch } from '@/components/customers/customer-search';
import { CustomersListHeader } from '@/components/customers/customers-list-header';
import { NoCustomersFound } from '@/components/customers/no-customers-found';
import { PageHeader } from '@/components/layout/page-header';
import { TranslatedCardTitle } from '@/components/layout/translated-card-title';
import { CustomersTable } from '@/components/customers/customers-table';

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect('/login');
  }

  const params = await searchParams;
  const where: any = {};
  if (params.search) {
    where.OR = [
      { name: { contains: params.search } },
      { phone: { contains: params.search } },
      { email: { contains: params.search } },
    ];
  }

  const customers = await prisma.customer.findMany({
    where,
    include: {
      _count: {
        select: { tickets: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <MainLayout>
      <div className="space-y-6 pt-6">
        <PageHeader
          titleKey="customers"
          descriptionKey="manageCustomers"
          actionButton={{
            labelKey: 'addCustomer',
            href: '/customers/new',
          }}
        />

        {/* Search Filter */}
        <Card>
          <CardHeader>
            <TranslatedCardTitle translationKey="searchCustomers" />
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />}>
              <CustomerSearch />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CustomersListHeader count={customers.length} searchQuery={params.search} />
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
    </MainLayout>
  );
}

