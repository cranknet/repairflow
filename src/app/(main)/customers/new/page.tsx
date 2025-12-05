'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/language-context';
import Link from 'next/link';

const createCustomerSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(1, t('nameRequired')),
  phone: z.string().min(1, t('phoneRequired')),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export default function NewCustomerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  const customerSchema = createCustomerSchema(t);
  type CustomerFormData = z.infer<typeof customerSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
  });

  const onSubmit = async (data: CustomerFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          email: data.email || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create customer');
      }

      const customer = await response.json();
      toast({
        title: t('success'),
        description: t('customerCreated'),
      });
      router.push(`/customers/${customer.id}`);
    } catch (error) {
      toast({
        title: t('error'),
        description: t('customerCreateFailed'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pt-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('addNewCustomer')}</h1>
        <p className="text-gray-600 dark:text-gray-400">{t('createNewCustomerProfile')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>{t('customerInformation')}</CardTitle>
            <CardDescription>{t('enterCustomerDetails')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('customerName')} *</Label>
                <Input id="name" {...register('name')} placeholder="John Doe" />
                {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t('customerPhone')} *</Label>
                <Input id="phone" {...register('phone')} placeholder="+1 (555) 123-4567" />
                {errors.phone && (
                  <p className="text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('customerEmail')}</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="john@example.com"
              />
              {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{t('customerAddress')}</Label>
              <Input id="address" {...register('address')} placeholder="123 Main St" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t('notes')}</Label>
              <textarea
                id="notes"
                {...register('notes')}
                rows={3}
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-700 dark:bg-gray-800"
                placeholder="Additional notes..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2 mt-6">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t('creating') : t('createCustomer')}
          </Button>
          <Link href="/customers">
            <Button type="button" variant="outline">
              {t('cancel')}
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}

