import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { CustomerSearch } from '@/components/customers/customer-search';

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Customers</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage customer information</p>
          </div>
          <Link href="/customers/new" className="mr-4">
            <Button>Add Customer</Button>
          </Link>
        </div>

        {/* Search Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Search Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />}>
              <CustomerSearch />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              All Customers ({customers.length})
              {params.search && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  - Filtered by &quot;{params.search}&quot;
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customers.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No customers found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800">
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Phone
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Tickets
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Created
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="py-3 px-4 font-medium">{customer.name}</td>
                        <td className="py-3 px-4">{customer.phone}</td>
                        <td className="py-3 px-4">{customer.email || '-'}</td>
                        <td className="py-3 px-4">{customer._count.tickets}</td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {format(new Date(customer.createdAt), 'MMM dd, yyyy')}
                        </td>
                        <td className="py-3 px-4">
                          <Link href={`/customers/${customer.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

