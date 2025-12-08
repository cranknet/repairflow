'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/language-context';

const supplierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  contactPerson: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

interface EditSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: {
    id: string;
    name: string;
    contactPerson?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    notes?: string | null;
  } | null;
  onSuccess: () => void;
}

export function EditSupplierModal({
  isOpen,
  onClose,
  supplier,
  onSuccess,
}: EditSupplierModalProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
  });

  // Reset form when supplier changes
  useEffect(() => {
    if (supplier) {
      reset({
        name: supplier.name,
        contactPerson: supplier.contactPerson || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        notes: supplier.notes || '',
      });
    }
  }, [supplier, reset]);

  const onSubmit = async (data: SupplierFormData) => {
    if (!supplier) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/suppliers/${supplier.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          email: data.email || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update supplier');
      }

      toast({
        title: t('success'),
        description: t('suppliers.update_success'),
      });
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : t('suppliers.update_failed'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('editSupplier')}</DialogTitle>
          <DialogDescription>
            {t('updateSupplierInformation')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Supplier Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-sup-name">
              {t('supplierName')} <span className="text-error-500">*</span>
            </Label>
            <Input
              id="edit-sup-name"
              {...register('name')}
              placeholder={t('finance.supplierForm.namePlaceholder')}
              errorText={errors.name?.message}
            />
          </div>

          {/* Contact Person & Phone - 2 column */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-sup-contact">{t('contactPerson')}</Label>
              <Input
                id="edit-sup-contact"
                {...register('contactPerson')}
                placeholder={t('finance.supplierForm.contactPersonPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-sup-phone">{t('phone')}</Label>
              <Input
                id="edit-sup-phone"
                {...register('phone')}
                placeholder={t('finance.supplierForm.phonePlaceholder')}
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="edit-sup-email">{t('email')}</Label>
            <Input
              id="edit-sup-email"
              type="email"
              {...register('email')}
              placeholder={t('finance.supplierForm.emailPlaceholder')}
              errorText={errors.email?.message}
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="edit-sup-address">{t('address')}</Label>
            <Input
              id="edit-sup-address"
              {...register('address')}
              placeholder={t('finance.supplierForm.addressPlaceholder')}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="edit-sup-notes">{t('notes')}</Label>
            <Textarea
              id="edit-sup-notes"
              {...register('notes')}
              placeholder={t('finance.supplierForm.notesPlaceholder')}
              rows={3}
            />
          </div>

          <DialogFooter className="pt-4 gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                  {t('saving') || 'Saving...'}
                </span>
              ) : (
                t('save')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
