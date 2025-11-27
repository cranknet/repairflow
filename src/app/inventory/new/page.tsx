'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

const partSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  quantity: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 0, {
    message: 'Valid quantity is required',
  }),
  reorderLevel: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 0, {
    message: 'Valid reorder level is required',
  }),
  unitPrice: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: 'Valid price is required',
  }),
  supplier: z.string().optional(),
});

type PartFormData = z.infer<typeof partSchema>;

export default function NewPartPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PartFormData>({
    resolver: zodResolver(partSchema),
    defaultValues: {
      quantity: '0',
      reorderLevel: '5',
      unitPrice: '0',
    },
  });

  const onSubmit = async (data: PartFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          quantity: parseInt(data.quantity),
          reorderLevel: parseInt(data.reorderLevel),
          unitPrice: parseFloat(data.unitPrice),
          supplier: data.supplier,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create part');
      }

      toast({
        title: 'Success',
        description: 'Part created successfully',
      });
      router.push('/inventory');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create part',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 pt-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add New Part</h1>
          <p className="text-gray-600 dark:text-gray-400">Add a new part to inventory</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Part Information</CardTitle>
              <CardDescription>Enter the part details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" {...register('name')} placeholder="Screen Replacement" />
                {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
                <p className="text-xs text-gray-500">SKU will be auto-generated from the part name</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  {...register('description')}
                  rows={3}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-700 dark:bg-gray-800"
                  placeholder="Part description..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    {...register('quantity')}
                    placeholder="0"
                  />
                  {errors.quantity && (
                    <p className="text-sm text-red-600">{errors.quantity.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reorderLevel">Reorder Level *</Label>
                  <Input
                    id="reorderLevel"
                    type="number"
                    {...register('reorderLevel')}
                    placeholder="5"
                  />
                  {errors.reorderLevel && (
                    <p className="text-sm text-red-600">{errors.reorderLevel.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Unit Price ($) *</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    {...register('unitPrice')}
                    placeholder="0.00"
                  />
                  {errors.unitPrice && (
                    <p className="text-sm text-red-600">{errors.unitPrice.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input id="supplier" {...register('supplier')} placeholder="Supplier name" />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 mt-6">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Part'}
            </Button>
            <Link href="/inventory">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}

