'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/language-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const createCustomerSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(1, t('nameRequired')),
  phone: z.string().min(1, t('phoneRequired')),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
});

interface NewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (customerId: string) => void;
}

export function NewCustomerModal({ isOpen, onClose, onSuccess }: NewCustomerModalProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  const customerSchema = createCustomerSchema(t);
  type CustomerFormData = z.infer<typeof customerSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
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
        throw new Error(t('customerCreateFailed'));
      }

      const customer = await response.json();
      toast({
        title: t('success'),
        description: t('customerCreated'),
      });
      reset();
      onSuccess(customer.id);
      onClose();
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('addNewCustomer')}</DialogTitle>
          <DialogDescription>{t('createNewCustomerProfile')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="modal-name"
                label={t('customerName')}
                errorText={errors.name?.message}
                required
                {...register('name')}
                placeholder={t('customers.placeholder.name')}
                autoFocus
              />

              <Input
                id="modal-phone"
                label={t('customerPhone')}
                errorText={errors.phone?.message}
                required
                {...register('phone')}
                placeholder={t('customers.placeholder.phone')}
              />
            </div>

            <Input
              id="modal-email"
              label={t('customerEmail')}
              errorText={errors.email?.message}
              type="email"
              {...register('email')}
              placeholder={t('customers.placeholder.email')}
            />

            <Input
              id="modal-address"
              label={t('customerAddress')}
              errorText={errors.address?.message}
              {...register('address')}
              placeholder={t('customers.placeholder.address')}
            />

            <Textarea
              id="modal-notes"
              label={t('notes')}
              errorText={errors.notes?.message}
              rows={2}
              {...register('notes')}
              placeholder={t('customers.placeholder.notes')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t('creating') : t('createCustomer')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

