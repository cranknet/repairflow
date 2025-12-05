'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/language-context';
import { ImageUpload } from '@/components/tickets/image-upload';
import { DeviceAutocomplete } from '@/components/tickets/device-autocomplete';
import { DeviceIssueAutocomplete } from '@/components/tickets/device-issue-autocomplete';
import { NewCustomerModal } from '@/components/customers/new-customer-modal';
import { CustomerSelect } from '@/components/customers/customer-select';
import { getCurrencySymbol } from '@/lib/currency';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewTicketModal({ isOpen, onClose, onSuccess }: NewTicketModalProps) {
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
    formState: { errors },
    setValue,
    watch,
    trigger,
    reset,
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
            trigger('customerId');
          }
        }
      })
      .catch((err) => console.error('Error fetching customers:', err));
  };

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
      fetchStaffUsers();
      fetchCurrency();
    }
  }, [isOpen]);

  const fetchCurrency = () => {
    fetch('/api/settings/public')
      .then((res) => res.json())
      .then((data) => {
        const currency = data.currency || 'USD';
        setCurrencySymbol(getCurrencySymbol(currency));
      })
      .catch((err) => {
        console.error('Error fetching currency:', err);
        setCurrencySymbol('$');
      });
  };

  const fetchStaffUsers = () => {
    fetch('/api/users/staff')
      .then((res) => res.json())
      .then((data) => setStaffUsers(data))
      .catch((err) => console.error('Error fetching staff users:', err));
  };

  const handleCustomerCreated = (customerId: string) => {
    fetchCustomers();
    setValue('customerId', customerId);
  };

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
      reset();
      setFrontImage('');
      setBackImage('');
      setDeviceBrand('');
      setDeviceModel('');
      onSuccess();
      onClose();
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
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Ticket</DialogTitle>
            <DialogDescription>Create a new repair ticket</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-6 py-4">
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
                <Controller
                  name="priority"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Select value={field.value || 'MEDIUM'} onValueChange={field.onChange}>
                      <SelectTrigger 
                        label="Priority" 
                        error={!!fieldState.error}
                        id="modal-ticket-priority"
                      >
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />

                <Input
                  id="modal-ticket-estimatedPrice"
                  label={`Estimated Price (${currencySymbol})`}
                  errorText={errors.estimatedPrice?.message}
                  type="number"
                  step="0.01"
                  required
                  {...register('estimatedPrice')}
                  placeholder="0.00"
                />
              </div>

              <Controller
                name="assignedToId"
                control={control}
                render={({ field, fieldState }) => (
                  <Select 
                    value={field.value || undefined} 
                    onValueChange={(value) => {
                      field.onChange(value === 'unassigned' ? undefined : value);
                    }}
                  >
                    <SelectTrigger 
                      label="Assign To (Optional)" 
                      error={!!fieldState.error}
                      id="modal-ticket-assignedToId"
                    >
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {staffUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.username} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="modal-ticket-warrantyDays"
                  label={`${t('warrantyDays')} (${t('optional')})`}
                  errorText={errors.warrantyDays?.message}
                  type="number"
                  min="0"
                  {...register('warrantyDays')}
                  placeholder="e.g., 30, 90, 180"
                />

                <Input
                  id="modal-ticket-warrantyText"
                  label={`${t('warrantyText')} (${t('optional')})`}
                  errorText={errors.warrantyText?.message}
                  {...register('warrantyText')}
                  placeholder="e.g., 30 days warranty on parts and labor"
                />
              </div>

              <Textarea
                id="modal-ticket-notes"
                label="Notes"
                errorText={errors.notes?.message}
                rows={3}
                {...register('notes')}
                placeholder="Additional notes..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Ticket'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <NewCustomerModal
        isOpen={showNewCustomerModal}
        onClose={() => setShowNewCustomerModal(false)}
        onSuccess={handleCustomerCreated}
      />
    </>
  );
}

