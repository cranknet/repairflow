'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ContactMessageStatusBadge } from './contact-message-status-badge';
import { ContactMessageDetailModal } from './contact-message-detail-modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EyeIcon, TrashIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

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

interface ContactMessagesClientProps {
  initialMessages: ContactMessage[];
  canDelete: boolean;
}

export function ContactMessagesClient({ initialMessages, canDelete }: ContactMessagesClientProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>(initialMessages);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [assignedFilter, setAssignedFilter] = useState<string>('ALL');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [emptyInboxConfirmOpen, setEmptyInboxConfirmOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<ContactMessage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchMessages();
  }, [statusFilter, assignedFilter]);

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

  const fetchMessages = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }
      if (assignedFilter !== 'ALL') {
        params.append('assignedTo', assignedFilter);
      }

      const response = await fetch(`/api/contact/messages?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: t('error'),
        description: t('failedToFetchData'),
        variant: 'destructive',
      });
    }
  };

  const handleView = (message: ContactMessage) => {
    setSelectedMessage(message);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedMessage(null);
    fetchMessages();
    router.refresh();
  };

  const handleStatusUpdate = async (messageId: string, newStatus: 'NEW' | 'READ' | 'ARCHIVED') => {
    try {
      const response = await fetch(`/api/contact/${messageId}`, {
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
      fetchMessages();
      router.refresh();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failedToUpdate'),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = (message: ContactMessage) => {
    if (!canDelete) return;
    setMessageToDelete(message);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!messageToDelete || !canDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/contact/${messageToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }

      toast({
        title: t('success'),
        description: t('contact.delete.success'),
      });
      fetchMessages();
      router.refresh();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('contact.delete.error'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setMessageToDelete(null);
    }
  };

  const handleEmptyInbox = () => {
    if (!canDelete) return;
    setEmptyInboxConfirmOpen(true);
  };

  const confirmEmptyInbox = async () => {
    if (!canDelete) {
      setEmptyInboxConfirmOpen(false);
      return;
    }
    setIsDeleting(true);
    try {
      const response = await fetch('/api/contact/messages', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete all messages');
      }

      const data = await response.json();
      toast({
        title: t('success'),
        description: t('contact.empty.success').replace('{count}', data.deletedCount?.toString() || '0'),
      });
      fetchMessages();
      router.refresh();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('contact.empty.error'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setEmptyInboxConfirmOpen(false);
    }
  };

  const filteredMessages = messages;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      {messages.length > 0 && canDelete && (
        <div className="flex justify-end">
          <Button
            variant="destructive"
            onClick={handleEmptyInbox}
            disabled={isDeleting}
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            {t('contact.empty.inbox')}
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">{t('contact.admin.filters.status')}</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t('contact.admin.filters.all')}</SelectItem>
              <SelectItem value="NEW">{t('contact.status.new')}</SelectItem>
              <SelectItem value="READ">{t('contact.status.read')}</SelectItem>
              <SelectItem value="ARCHIVED">{t('contact.status.archived')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">{t('contact.admin.filters.assigned')}</label>
          <Select value={assignedFilter} onValueChange={setAssignedFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t('contact.admin.filters.all')}</SelectItem>
              <SelectItem value="UNASSIGNED">{t('contact.admin.unassigned')}</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name || user.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Messages Table */}
      {filteredMessages.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          {t('contact.admin.no_messages')}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                  {t('name')}
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                  {t('contact.detail.email')}
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                  {t('contact.detail.ticket')}
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                  {t('contact.detail.message')}
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                  {t('status')}
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                  {t('contact.detail.assigned_to')}
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                  {t('contact.detail.received')}
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMessages.map((message) => (
                <tr
                  key={message.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="py-3 px-4">
                    <div className="font-medium">{message.name}</div>
                  </td>
                  <td className="py-3 px-4">
                    <a
                      href={`mailto:${message.email}`}
                      className="text-primary hover:underline text-sm"
                    >
                      {message.email}
                    </a>
                  </td>
                  <td className="py-3 px-4">
                    {message.ticket ? (
                      <Link
                        href={`/tickets/${message.ticket.id}`}
                        className="text-primary hover:underline text-sm"
                      >
                        {message.ticket.ticketNumber}
                      </Link>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {message.message}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <ContactMessageStatusBadge status={message.status} />
                  </td>
                  <td className="py-3 px-4">
                    {message.assignedTo ? (
                      <span className="text-sm">
                        {message.assignedTo.name || message.assignedTo.username}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">{t('contact.admin.unassigned')}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(message.createdAt), 'PPp')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outlined"
                        size="sm"
                        onClick={() => handleView(message)}
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        {t('contact.admin.view')}
                      </Button>
                      {message.status === 'NEW' && (
                        <Button
                          variant="tonal"
                          size="sm"
                          onClick={() => handleStatusUpdate(message.id, 'READ')}
                        >
                          {t('contact.admin.mark_read')}
                        </Button>
                      )}
                      {message.status !== 'ARCHIVED' && (
                        <Button
                          variant="outlined"
                          size="sm"
                          onClick={() => handleStatusUpdate(message.id, 'ARCHIVED')}
                        >
                          {t('contact.admin.archive')}
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(message)}
                          disabled={isDeleting}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      <ContactMessageDetailModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        message={selectedMessage}
        onUpdate={handleModalClose}
        canDelete={canDelete}
      />

      {/* Delete Confirmation Dialog */}
      {canDelete && messageToDelete && (
        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title={t('contact.delete.confirmTitle')}
          description={t('contact.delete.confirmDescription').replace('{name}', messageToDelete.name)}
          confirmText={t('delete')}
          cancelText={t('cancel')}
          variant="destructive"
          onConfirm={confirmDelete}
          isLoading={isDeleting}
        />
      )}

      {/* Empty Inbox Confirmation Dialog */}
      {canDelete && (
        <ConfirmDialog
          open={emptyInboxConfirmOpen}
          onOpenChange={setEmptyInboxConfirmOpen}
          title={t('contact.empty.confirmTitle')}
          description={t('contact.empty.confirmDescription').replace('{count}', messages.length.toString())}
          confirmText={t('contact.empty.inbox')}
          cancelText={t('cancel')}
          variant="destructive"
          onConfirm={confirmEmptyInbox}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}

