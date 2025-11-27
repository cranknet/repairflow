'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { ImageUpload } from '@/components/tickets/image-upload';
import { DeviceAutocomplete } from '@/components/tickets/device-autocomplete';
import { DeviceIssueAutocomplete } from '@/components/tickets/device-issue-autocomplete';
import { NewCustomerModal } from '@/components/customers/new-customer-modal';
import { CustomerSelect } from '@/components/customers/customer-select';
import { useLanguage } from '@/contexts/language-context';
import { getCurrencySymbol } from '@/lib/currency';

const createTicketSchema = (t: (key: string) => string) => z.object({
  customerId: z.string().min(1, t('customerRequired')),
  deviceBrand: z.string().min(1, t('deviceBrandRequired')),
  deviceModel: z.string().min(1, t('deviceModelRequired')),
  deviceIssue: z.string().min(1, t('deviceIssueRequired')),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  estimatedPrice: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: t('validPriceRequired'),
  }),
  assignedToId: z.string().optional(),
  warrantyDays: z.string().optional().refine((val) => !val || (!isNaN(parseInt(val)) && parseInt(val) >= 0), {
    message: t('validWarrantyDaysRequired'),
  }),
  warrantyText: z.string().optional(),
  notes: z.string().optional(),
});

export default function NewTicketPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [customers, setCustomers] = useState<any[]>([]);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [frontImage, setFrontImage] = useState<string>('');
  const [backImage, setBackImage] = useState<string>('');
  const [deviceBrand, setDeviceBrand] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('$');

  const ticketSchema = createTicketSchema(t);
  type TicketFormData = z.infer<typeof ticketSchema>;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
    setValue,
    watch,
    trigger,
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      priority: 'MEDIUM',
      estimatedPrice: '0',
    },
    mode: 'onChange',
  });

  const fetchCustomers = () => {
    fetch('/api/customers')
      .then((res) => res.json())
      .then((data) => {
        setCustomers(data);
        // Set walking-customer as default if it exists
        const walkingCustomer = data.find((c: any) => 
          c.id === 'walking-customer' ||
          c.name.toLowerCase() === 'walking-customer' ||
          c.name === 'walking-customer'
        );
        if (walkingCustomer) {
          const currentCustomerId = watch('customerId');
          if (!currentCustomerId) {
            setValue('customerId', walkingCustomer.id);
            trigger('customerId'); // Trigger validation
          }
        }
      })
      .catch((err) => console.error('Error fetching customers:', err));
  };

  useEffect(() => {
    fetchCustomers();
    fetchStaffUsers();
    fetchCurrency();
  }, []);

  const fetchCurrency = () => {
    fetch('/api/settings/public')
      .then((res) => res.json())
      .then((data) => {
        const currency = data.currency || 'USD';
        setCurrencySymbol(getCurrencySymbol(currency));
      })
      .catch((err) => {
        console.error('Error fetching currency:', err);
        setCurrencySymbol('$'); // Default to USD
      });
  };

  const fetchStaffUsers = () => {
    fetch('/api/users/staff')
      .then((res) => res.json())
      .then((data) => setStaffUsers(data))
      .catch((err) => console.error('Error fetching staff users:', err));
  };

  const handleCustomerCreated = (customerId: string) => {
    // Refresh customers list
    fetchCustomers();
    // Select the newly created customer
    setValue('customerId', customerId);
  };

  // Sync device brand and model with form
  useEffect(() => {
    setValue('deviceBrand', deviceBrand);
  }, [deviceBrand, setValue]);

  useEffect(() => {
    setValue('deviceModel', deviceModel);
  }, [deviceModel, setValue]);

  const onSubmit = async (data: TicketFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: data.customerId,
          deviceBrand: data.deviceBrand,
          deviceModel: data.deviceModel,
          deviceIssue: data.deviceIssue,
          priority: data.priority,
          estimatedPrice: parseFloat(data.estimatedPrice),
          warrantyDays: data.warrantyDays && data.warrantyDays.trim() !== '' ? parseInt(data.warrantyDays) : undefined,
          warrantyText: data.warrantyText || undefined,
          assignedToId: data.assignedToId && data.assignedToId.trim() !== '' ? data.assignedToId : undefined,
          notes: data.notes || undefined,
          deviceConditionFront: frontImage && frontImage.trim() !== '' ? frontImage : undefined,
          deviceConditionBack: backImage && backImage.trim() !== '' ? backImage : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create ticket' }));
        const errorMessage = errorData.details 
          ? errorData.details.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
          : errorData.error || 'Failed to create ticket';
        throw new Error(errorMessage);
      }

      const ticket = await response.json();
      toast({
        title: t('success'),
        description: t('ticketCreated'),
      });
      router.push(`/tickets/${ticket.id}`);
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      toast({
        title: t('error'),
        description: error.message || t('ticketCreateFailed'),
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <MainLayout>
      <div className="space-y-6 pt-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Ticket</h1>
          <p className="text-gray-600 dark:text-gray-400">Create a new repair ticket</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Ticket Information</CardTitle>
              <CardDescription>Enter the details for the repair ticket</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerId">Customer *</Label>
                <div className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Controller
                      name="customerId"
                      control={control}
                      rules={{ required: 'Customer is required' }}
                      render={({ field, fieldState }) => (
                        <CustomerSelect
                          customers={customers}
                          value={field.value || ''}
                          onChange={field.onChange}
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewCustomerModal(true)}
                    className="mt-0"
                  >
                    New Customer
                  </Button>
                </div>
              </div>

              <DeviceAutocomplete
                brand={deviceBrand}
                model={deviceModel}
                onBrandChange={setDeviceBrand}
                onModelChange={setDeviceModel}
                brandError={errors.deviceBrand?.message}
                modelError={errors.deviceModel?.message}
              />

              <Controller
                name="deviceIssue"
                control={control}
                rules={{ required: 'Device issue is required' }}
                render={({ field, fieldState }) => (
                  <DeviceIssueAutocomplete
                    value={field.value || ''}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <ImageUpload
                  label="Device Front Photo"
                  value={frontImage}
                  onChange={setFrontImage}
                  onRemove={() => setFrontImage('')}
                />
                <ImageUpload
                  label="Device Back Photo"
                  value={backImage}
                  onChange={setBackImage}
                  onRemove={() => setBackImage('')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority *</Label>
                  <select
                    id="priority"
                    {...register('priority')}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedPrice">Estimated Price ({currencySymbol}) *</Label>
                  <Input
                    id="estimatedPrice"
                    type="number"
                    step="0.01"
                    {...register('estimatedPrice')}
                    placeholder="0.00"
                  />
                  {errors.estimatedPrice && (
                    <p className="text-sm text-red-600">{errors.estimatedPrice.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedToId">Assign To (Optional)</Label>
                <select
                  id="assignedToId"
                  {...register('assignedToId')}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-700 dark:bg-gray-800"
                >
                  <option value="">Unassigned</option>
                  {staffUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.username} ({user.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="warrantyDays">{t('warrantyDays')} ({t('optional')})</Label>
                  <Input
                    id="warrantyDays"
                    type="number"
                    min="0"
                    {...register('warrantyDays')}
                    placeholder="e.g., 30, 90, 180"
                  />
                  {errors.warrantyDays && (
                    <p className="text-sm text-red-600">{errors.warrantyDays.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warrantyText">{t('warrantyText')} ({t('optional')})</Label>
                  <Input
                    id="warrantyText"
                    {...register('warrantyText')}
                    placeholder="e.g., 30 days warranty on parts and labor"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
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
              {isLoading ? 'Creating...' : 'Create Ticket'}
            </Button>
            <Link href="/tickets">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>

      <NewCustomerModal
        isOpen={showNewCustomerModal}
        onClose={() => setShowNewCustomerModal(false)}
        onSuccess={handleCustomerCreated}
      />
    </MainLayout>
  );
}

