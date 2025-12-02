'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { ContactMessageStatusBadge } from './contact-message-status-badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { format } from 'date-fns';
import Link from 'next/link';
import { TrashIcon } from '@heroicons/react/24/outline';

interface ContactMessage {
  id: string;
  ticketId: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: 'NEW' | 'READ' | 'ARCHIVED';
  assignedToId: string | null;
  createdAt: string;
  ticket?: {
    id: string;
    ticketNumber: string;
  } | null;
  assignedTo?: {
    id: string;
    name: string | null;
    username: string;
  } | null;
}

interface User {
  id: string;
  name: string | null;
  username: string;
}

interface ContactMessageDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: ContactMessage | null;
  onUpdate: () => void;
  canDelete?: boolean;
}

export function ContactMessageDetailModal({
  isOpen,
  onClose,
  message,
  onUpdate,
  canDelete = false,
}: ContactMessageDetailModalProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isUpdating, setIsUpdating] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && message) {
      setSelectedUserId(message.assignedToId || 'unassigned');
      fetchUsers();
    }
  }, [isOpen, message]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users/staff');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleStatusUpdate = async (newStatus: 'NEW' | 'READ' | 'ARCHIVED') => {
    if (!message) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/contact/${message.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      toast({
        title: t('success'),
        description: t('contact.admin.mark_read'),
      });
      onUpdate();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failedToUpdate'),
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssign = async () => {
    if (!message) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/contact/${message.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedToId: selectedUserId === 'unassigned' ? null : selectedUserId }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign message');
      }

      toast({
        title: t('success'),
        description: t('contact.admin.assign') + ' ' + t('success'),
      });
      onUpdate();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failedToUpdate'),
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = () => {
    if (!canDelete) return;
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!message || !canDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/contact/${message.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }

      toast({
        title: t('success'),
        description: t('contact.delete.success'),
      });
      onUpdate();
      onClose();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('contact.delete.error'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  if (!isOpen || !message) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-50 w-full max-w-2xl mx-4 max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {t('contact.admin.title')}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <ContactMessageStatusBadge status={message.status} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Message Details */}
          <Card>
            <CardHeader>
              <CardTitle>{t('contact.detail.message')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{message.message}</p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('contact.detail.from')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('name')}</p>
                <p className="font-medium">{message.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('contact.detail.email')}</p>
                <a
                  href={`mailto:${message.email}`}
                  className="font-medium text-primary hover:underline"
                >
                  {message.email}
                </a>
              </div>
              {message.phone && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('contact.detail.phone')}</p>
                  <a
                    href={`tel:${message.phone}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {message.phone}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('additionalInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {message.ticket && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('contact.detail.ticket')}</p>
                  <Link
                    href={`/tickets/${message.ticket.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {message.ticket.ticketNumber}
                  </Link>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('contact.detail.received')}</p>
                <p className="font-medium">{format(new Date(message.createdAt), 'PPpp')}</p>
              </div>
              {message.assignedTo && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('contact.detail.assigned_to')}</p>
                  <p className="font-medium">
                    {message.assignedTo.name || message.assignedTo.username}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
              {message.status === 'NEW' && (
                <Button
                  onClick={() => handleStatusUpdate('READ')}
                  disabled={isUpdating}
                  variant="tonal"
                  size="sm"
                >
                  {t('contact.admin.mark_read')}
                </Button>
              )}
              {message.status !== 'ARCHIVED' && (
                <Button
                  onClick={() => handleStatusUpdate('ARCHIVED')}
                  disabled={isUpdating}
                  variant="outlined"
                  size="sm"
                >
                  {t('contact.admin.archive')}
                </Button>
              )}
              {canDelete && (
                <Button
                  onClick={handleDelete}
                  disabled={isUpdating || isDeleting}
                  variant="destructive"
                  size="sm"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  {t('delete')}
                </Button>
              )}
            </div>

            {/* Assign Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('contact.admin.assign')}</label>
              <div className="flex gap-2">
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={t('contact.admin.unassigned')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">{t('contact.admin.unassigned')}</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || user.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAssign}
                  disabled={isUpdating || selectedUserId === (message.assignedToId || 'unassigned')}
                  size="sm"
                >
                  {t('contact.admin.assign')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {canDelete && (
        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title={t('contact.delete.confirmTitle')}
          description={t('contact.delete.confirmDescription').replace('{name}', message.name)}
          confirmText={t('delete')}
          cancelText={t('cancel')}
          variant="destructive"
          onConfirm={confirmDelete}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}

