import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; search?: string }>;
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
      { sku: { contains: params.search } },
      { description: { contains: params.search } },
    ];
  }

  let parts = await prisma.part.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  // Filter for low stock in memory if needed
  if (params.filter === 'low_stock') {
    parts = parts.filter((part) => part.quantity <= part.reorderLevel);
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventory</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage spare parts and stock</p>
          </div>
          <Link href="/inventory/new">
            <Button>Add Part</Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Link href="/inventory">
                <Button variant={!params.filter ? 'default' : 'outline'}>All</Button>
              </Link>
              <Link href="/inventory?filter=low_stock">
                <Button variant={params.filter === 'low_stock' ? 'default' : 'outline'}>
                  Low Stock
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Parts List */}
        <Card>
          <CardHeader>
            <CardTitle>Parts ({parts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {parts.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No parts found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800">
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        SKU
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Quantity
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Reorder Level
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Unit Price
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {parts.map((part) => {
                      const isLowStock = part.quantity <= part.reorderLevel;
                      return (
                        <tr
                          key={part.id}
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <td className="py-3 px-4 font-medium">{part.name}</td>
                          <td className="py-3 px-4 font-mono text-sm">{part.sku}</td>
                          <td className="py-3 px-4">{part.quantity}</td>
                          <td className="py-3 px-4">{part.reorderLevel}</td>
                          <td className="py-3 px-4">${part.unitPrice.toFixed(2)}</td>
                          <td className="py-3 px-4">
                            {isLowStock ? (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                Low Stock
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                In Stock
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Link href={`/inventory/${part.id}`}>
                                <Button variant="ghost" size="sm">
                                  View
                                </Button>
                              </Link>
                              <Link href={`/inventory/${part.id}/edit`}>
                                <Button variant="ghost" size="sm">
                                  Edit
                                </Button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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

