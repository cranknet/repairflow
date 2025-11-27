import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { DeletePartButton } from '@/components/inventory/delete-part-button';

export default async function PartDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) {
    redirect('/login');
  }

  const { id } = await params;
  const part = await prisma.part.findUnique({
    where: { id },
    include: {
      inventoryTransactions: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!part) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Part Not Found</h1>
          <Link href="/inventory">
            <Button className="mt-4">Back to Inventory</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const isLowStock = part.quantity <= part.reorderLevel;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{part.name}</h1>
            <p className="text-gray-600 dark:text-gray-400">Part Details</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/inventory/${part.id}/edit`}>
              <Button>Edit</Button>
            </Link>
            <DeletePartButton partId={part.id} partName={part.name} />
            <Link href="/inventory">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back to List
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Part Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">SKU</p>
                    <p className="font-mono font-medium">{part.sku}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Quantity</p>
                    <p className="font-medium text-lg">{part.quantity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Reorder Level</p>
                    <p className="font-medium">{part.reorderLevel}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Unit Price</p>
                    <p className="font-medium">${part.unitPrice.toFixed(2)}</p>
                  </div>
                  {part.supplier && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Supplier</p>
                      <p className="font-medium">{part.supplier}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                    {isLowStock ? (
                      <span className="inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        In Stock
                      </span>
                    )}
                  </div>
                </div>
                {part.description && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Description</p>
                    <p className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">{part.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {part.inventoryTransactions.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No transactions yet</p>
                ) : (
                  <div className="space-y-2">
                    {part.inventoryTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded"
                      >
                        <div>
                          <p className="font-medium">
                            {transaction.type === 'IN' ? 'Stock In' : 'Stock Out'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {transaction.reason || 'No reason provided'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(transaction.createdAt), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                        <p
                          className={`font-medium ${
                            transaction.type === 'IN' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {transaction.type === 'IN' ? '+' : '-'}
                          {transaction.quantity}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

