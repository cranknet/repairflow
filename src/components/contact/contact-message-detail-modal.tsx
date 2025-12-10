'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { ContactMessageStatusBadge } from './contact-message-status-badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  EnvelopeOpenIcon,
  ArchiveBoxIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

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

  if (!message) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <DialogTitle>{t('contact.admin.title')}</DialogTitle>
              <ContactMessageStatusBadge status={message.status} />
            </div>
            <DialogDescription>
              {t('contact.detail.description') || 'View and manage this contact message'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Message Details */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t('contact.detail.message')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap text-foreground">{message.message}</p>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t('contact.detail.from')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t('name')}</p>
                    <p className="font-medium text-sm">{message.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t('contact.detail.email')}</p>
                    <a
                      href={`mailto:${message.email}`}
                      className="font-medium text-sm text-primary hover:underline"
                    >
                      {message.email}
                    </a>
                  </div>
                  {message.phone && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{t('contact.detail.phone')}</p>
                      <a
                        href={`tel:${message.phone}`}
                        className="font-medium text-sm text-primary hover:underline"
                      >
                        {message.phone}
                      </a>
                    </div>
                  )}
                  {message.ticket && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{t('contact.detail.ticket')}</p>
                      <Link
                        href={`/tickets/${message.ticket.id}`}
                        className="font-medium text-sm text-primary hover:underline"
                      >
                        {message.ticket.ticketNumber}
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t('contact.detail.received')}</p>
                <p className="font-medium text-sm">{format(new Date(message.createdAt), 'PPpp')}</p>
              </div>
              {message.assignedTo && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('contact.detail.assigned_to')}</p>
                  <p className="font-medium text-sm">
                    {message.assignedTo.name || message.assignedTo.username}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-4 pt-4 border-t border-border">
              {/* Status Actions */}
              <div className="flex flex-wrap gap-2">
                {message.status === 'NEW' && (
                  <Button
                    onClick={() => handleStatusUpdate('READ')}
                    disabled={isUpdating}
                    variant="secondary"
                    size="sm"
                  >
                    <EnvelopeOpenIcon className="h-4 w-4 mr-1.5" />
                    {t('contact.admin.mark_read')}
                  </Button>
                )}
                {message.status !== 'ARCHIVED' && (
                  <Button
                    onClick={() => handleStatusUpdate('ARCHIVED')}
                    disabled={isUpdating}
                    variant="outline"
                    size="sm"
                  >
                    <ArchiveBoxIcon className="h-4 w-4 mr-1.5" />
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
                    <TrashIcon className="h-4 w-4 mr-1.5" />
                    {t('delete')}
                  </Button>
                )}
              </div>

              {/* Assign Section */}
              <div className="space-y-2">
                <Label>{t('contact.admin.assign')}</Label>
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
        </DialogContent>
      </Dialog>

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
    </>
  );
}
