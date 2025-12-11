'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { useSession } from 'next-auth/react';
import { BellIcon } from '@heroicons/react/24/outline';

interface NotificationPreference {
  id?: string;
  entityType: string;
  action: string;
  enabled: boolean;
}

// Entity types with translation keys
const ENTITY_TYPES = [
  { value: 'customer', labelKey: 'customer' },
  { value: 'ticket', labelKey: 'ticket' },
  { value: 'payment', labelKey: 'payment' },
  { value: 'charge', labelKey: 'charge' },
  { value: 'repairjob', labelKey: 'repairJob' },
  { value: 'part', labelKey: 'part' },
  { value: 'supplier', labelKey: 'supplier' },
];

// Actions with translation keys
const ACTIONS = [
  { value: 'created', labelKey: 'created' },
  { value: 'updated', labelKey: 'updated' },
  { value: 'deleted', labelKey: 'deleted' },
  { value: 'status_changed', labelKey: 'statusChanged' },
  { value: 'assigned', labelKey: 'assigned' },
  { value: 'completed', labelKey: 'completed' },
  { value: 'used', labelKey: 'used' },
  { value: 'removed', labelKey: 'removed' },
  { value: 'added', labelKey: 'added' },
];

export function NotificationPreferences() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { data: session } = useSession();
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/notifications/preferences`);
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences || []);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePreference = (entityType: string, action: string) => {
    setPreferences((prev) => {
      const existing = prev.find(
        (p) => p.entityType === entityType && p.action === action
      );

      if (existing) {
        return prev.map((p) =>
          p.entityType === entityType && p.action === action
            ? { ...p, enabled: !p.enabled }
            : p
        );
      } else {
        return [...prev, { entityType, action, enabled: false }];
      }
    });
  };

  const getPreference = (entityType: string, action: string): boolean => {
    const pref = preferences.find(
      (p) => p.entityType === entityType && p.action === action
    );
    return pref ? pref.enabled : true; // Default to enabled
  };

  const savePreferences = async () => {
    if (!session?.user?.id) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      });

      if (response.ok) {
        toast({
          title: t('success'),
          description: t('notificationPreferencesSaved'),
        });
        await fetchPreferences();
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failedToSaveNotificationPreferences'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">{t('loadingPreferences')}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="overflow-hidden border-0 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-yellow-500/10">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/25">
              <BellIcon className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl">{t('settings.notifications.title') || 'Notification Preferences'}</CardTitle>
              <CardDescription>
                {t('settings.notifications.description') || 'Choose which notifications you want to receive'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('notificationPreferences')}</CardTitle>
          <CardDescription>
            {t('notificationPreferencesDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {ENTITY_TYPES.map((entity) => (
            <div key={entity.value} className="space-y-3">
              <h3 className="font-semibold text-lg">{t(entity.labelKey)}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {ACTIONS.filter((action) => {
                  // Filter actions based on entity type
                  if (entity.value === 'customer' || entity.value === 'supplier') {
                    return ['created', 'updated', 'deleted'].includes(action.value);
                  }
                  if (entity.value === 'ticket') {
                    return ['created', 'updated', 'status_changed', 'deleted'].includes(action.value);
                  }
                  if (entity.value === 'payment') {
                    return ['created'].includes(action.value);
                  }
                  if (entity.value === 'charge') {
                    return ['added', 'removed'].includes(action.value);
                  }
                  if (entity.value === 'repairjob') {
                    return ['assigned', 'completed', 'updated'].includes(action.value);
                  }
                  if (entity.value === 'part') {
                    return ['used', 'removed'].includes(action.value);
                  }
                  return false;
                }).map((action) => (
                  <label
                    key={`${entity.value}-${action.value}`}
                    className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <input
                      type="checkbox"
                      checked={getPreference(entity.value, action.value)}
                      onChange={() => togglePreference(entity.value, action.value)}
                      className="rounded"
                    />
                    <span className="text-sm">{t(action.labelKey)}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="pt-4 border-t">
            <Button onClick={savePreferences} disabled={isSaving}>
              {isSaving ? t('saving') : t('savePreferences')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


