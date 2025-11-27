'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  reason: z.string().optional(),
});

type PartFormData = z.infer<typeof partSchema>;

export default function EditPartPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const partId = params.id as string;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<PartFormData>({
    resolver: zodResolver(partSchema),
  });

  useEffect(() => {
    const fetchPart = async () => {
      try {
        const response = await fetch(`/api/inventory/${partId}`);
        if (!response.ok) throw new Error('Failed to fetch part');
        const part = await response.json();
        
        setValue('name', part.name);
        setValue('description', part.description || '');
        setValue('quantity', part.quantity.toString());
        setValue('reorderLevel', part.reorderLevel.toString());
        setValue('unitPrice', part.unitPrice.toString());
        setValue('supplier', part.supplier || '');
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load part details',
        });
        router.push('/inventory');
      } finally {
        setIsFetching(false);
      }
    };

    if (partId) {
      fetchPart();
    }
  }, [partId, setValue, router, toast]);

  const onSubmit = async (data: PartFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/inventory/${partId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          quantity: parseInt(data.quantity),
          reorderLevel: parseInt(data.reorderLevel),
          unitPrice: parseFloat(data.unitPrice),
          supplier: data.supplier,
          reason: data.reason || 'Manual update',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update part');
      }

      toast({
        title: 'Success',
        description: 'Part updated successfully',
      });
      router.push(`/inventory/${partId}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update part',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-600">Loading...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 pt-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Part</h1>
          <p className="text-gray-600 dark:text-gray-400">Update part information</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Part Information</CardTitle>
              <CardDescription>Update the part details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" {...register('name')} placeholder="Screen Replacement" />
                {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
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

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Change (Optional)</Label>
                <Input 
                  id="reason" 
                  {...register('reason')} 
                  placeholder="e.g., Stock adjustment, price update"
                />
                <p className="text-xs text-gray-500">This will be recorded in transaction history</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 mt-6">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Part'}
            </Button>
            <Link href={`/inventory/${partId}`}>
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

