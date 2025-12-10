'use client';

import { useState, useEffect } from 'react';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/language-context';
import { TicketDetailsData } from '../new-ticket-wizard';
import { DeviceIssueAutocomplete } from '../device-issue-autocomplete';

interface StaffUser {
  id: string;
  name: string | null;
  username: string;
  role: string;
}

interface StepTicketDetailsProps {
  data: TicketDetailsData;
  onChange: (data: TicketDetailsData) => void;
  currencySymbol: string;
}

export function StepTicketDetails({ data, onChange, currencySymbol }: StepTicketDetailsProps) {
  const { t } = useLanguage();
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);

  // Fetch staff users on mount
  useEffect(() => {
    fetch('/api/users/staff')
      .then((res) => res.json())
      .then((data) => setStaffUsers(data))
      .catch((err) => console.error('Error fetching staff users:', err));
  }, []);

  const handleChange = <K extends keyof TicketDetailsData>(
    field: K,
    value: TicketDetailsData[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Device Issue */}
      <div>
        <DeviceIssueAutocomplete
          value={data.deviceIssue}
          onChange={(value) => handleChange('deviceIssue', value)}
          error={undefined}
        />
      </div>

      {/* Price and Priority Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          id="estimatedPrice"
          label={`${t('estimatedPrice')} (${currencySymbol}) *`}
          type="number"
          step="0.01"
          min="0"
          value={data.estimatedPrice}
          onChange={(e) => handleChange('estimatedPrice', e.target.value)}
          placeholder="0.00"
        />

        <div>
          <Label htmlFor="priority">{t('priority')}</Label>
          <Select
            value={data.priority}
            onValueChange={(value) => handleChange('priority', value as TicketDetailsData['priority'])}
          >
            <SelectTrigger id="priority">
              <SelectValue placeholder={t('selectPriority')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">{t('low')}</SelectItem>
              <SelectItem value="MEDIUM">{t('medium')}</SelectItem>
              <SelectItem value="HIGH">{t('high')}</SelectItem>
              <SelectItem value="URGENT">{t('urgent')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Assignment */}
      <div>
        <Label htmlFor="assignedToId">{t('assignToOptional')}</Label>
        <Select
          value={data.assignedToId || 'unassigned'}
          onValueChange={(value) =>
            handleChange('assignedToId', value === 'unassigned' ? undefined : value)
          }
        >
          <SelectTrigger id="assignedToId">
            <SelectValue placeholder={t('unassigned')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">{t('unassigned')}</SelectItem>
            {staffUsers.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name || user.username} ({user.role})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Warranty */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          id="warrantyDays"
          label={`${t('warrantyDays')} (${t('optional')})`}
          type="number"
          min="0"
          value={data.warrantyDays || ''}
          onChange={(e) => handleChange('warrantyDays', e.target.value || undefined)}
          placeholder="e.g., 30, 90, 180"
        />

        <Input
          id="warrantyText"
          label={`${t('warrantyText')} (${t('optional')})`}
          value={data.warrantyText || ''}
          onChange={(e) => handleChange('warrantyText', e.target.value || undefined)}
          placeholder="e.g., 30 days warranty on parts and labor"
        />
      </div>

      {/* Notes */}
      <Textarea
        id="notes"
        label={t('notes')}
        value={data.notes || ''}
        onChange={(e) => handleChange('notes', e.target.value || undefined)}
        placeholder={t('customers.placeholder.notes')}
        rows={3}
      />
    </div>
  );
}

