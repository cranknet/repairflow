import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default async function SupplierDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) {
    redirect('/login');
  }

  const { id } = await params;
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      parts: {
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          sku: true,
          quantity: true,
          reorderLevel: true,
          unitPrice: true,
        },
      },
      _count: {
        select: { parts: true },
      },
    },
  });

  if (!supplier) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Supplier Not Found</h1>
        <Link href="/suppliers">
          <Button className="mt-4">Back to Suppliers</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{supplier.name}</h1>
          <p className="text-gray-600 dark:text-gray-400">Supplier Details</p>
        </div>
        <Link href="/suppliers">
          <Button variant="ghost" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to List
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {supplier.contactPerson && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Contact Person</p>
                  <p className="font-medium">{supplier.contactPerson}</p>
                </div>
              )}
              {supplier.email && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                  <p className="font-medium">{supplier.email}</p>
                </div>
              )}
              {supplier.phone && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                  <p className="font-medium">{supplier.phone}</p>
                </div>
              )}
              {supplier.address && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
                  <p className="font-medium">{supplier.address}</p>
                </div>
              )}
              {supplier.notes && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Notes</p>
                  <p className="font-medium whitespace-pre-wrap">{supplier.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Parts ({supplier._count.parts})</CardTitle>
            </CardHeader>
            <CardContent>
              {supplier.parts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No parts associated with this supplier</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-800">
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Name</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">SKU</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Quantity</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Unit Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplier.parts.map((part) => (
                        <tr
                          key={part.id}
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <td className="py-3 px-4 font-medium">{part.name}</td>
                          <td className="py-3 px-4 font-mono text-sm">{part.sku}</td>
                          <td className="py-3 px-4">
                            <span className={part.quantity <= part.reorderLevel ? 'text-orange-600 font-semibold' : ''}>
                              {part.quantity}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {part.unitPrice > 0 ? `$${part.unitPrice.toFixed(2)}` : '-'}
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

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
                <p className="font-medium">
                  <span suppressHydrationWarning>
                    {format(new Date(supplier.createdAt), 'MMM dd, yyyy')}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Parts</p>
                <p className="font-medium">{supplier._count.parts}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

