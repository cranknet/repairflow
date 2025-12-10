'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { ContactMessageStatusBadge } from './contact-message-status-badge';
import { ContactMessageDetailModal } from './contact-message-detail-modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  RectangleStackIcon,
  TableCellsIcon,
  TrashIcon,
  EnvelopeIcon,
  EnvelopeOpenIcon,
  ArchiveBoxIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  InboxIcon,
  CalendarDaysIcon,
  TicketIcon,
  ClockIcon,
  CheckIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { ComponentType, SVGProps } from 'react';

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

const statusConfig: Record<string, { Icon: ComponentType<SVGProps<SVGSVGElement>>; gradient: string; bgLight: string; text: string }> = {
  NEW: {
    Icon: EnvelopeIcon,
    gradient: 'from-blue-500 to-indigo-600',
    bgLight: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
  },
  READ: {
    Icon: EnvelopeOpenIcon,
    gradient: 'from-gray-500 to-slate-600',
    bgLight: 'bg-gray-50 dark:bg-gray-900/20',
    text: 'text-gray-600 dark:text-gray-400',
  },
  ARCHIVED: {
    Icon: ArchiveBoxIcon,
    gradient: 'from-amber-500 to-orange-600',
    bgLight: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-600 dark:text-amber-400',
  },
};

export function ContactMessagesClient({ initialMessages, canDelete }: ContactMessagesClientProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>(initialMessages);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [emptyInboxConfirmOpen, setEmptyInboxConfirmOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<ContactMessage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [statusFilter]);

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
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter);
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
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const newCount = messages.filter((m) => m.status === 'NEW').length;
    const readCount = messages.filter((m) => m.status === 'READ').length;
    const archivedCount = messages.filter((m) => m.status === 'ARCHIVED').length;
    const withTicket = messages.filter((m) => m.ticketId).length;

    return {
      total: messages.length,
      new: newCount,
      read: readCount,
      archived: archivedCount,
      withTicket,
    };
  }, [messages]);

  // Filter messages
  const filteredMessages = useMemo(() => {
    let filtered = messages;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(term) ||
          m.email.toLowerCase().includes(term) ||
          m.message.toLowerCase().includes(term) ||
          m.ticket?.ticketNumber.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [messages, searchTerm]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: Record<string, ContactMessage[]> = {};
    filteredMessages.forEach((message) => {
      const date = new Date(message.createdAt).toLocaleDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(message);
    });
    return groups;
  }, [filteredMessages]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-950">
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-colors mb-6 group"
          >
            <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">{t('backToDashboard')}</span>
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                {t('contact.admin.title')}
              </h1>
              <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-2xl">
                {t('contact.admin.description') || 'Manage customer inquiries and support requests'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-xl p-1 shadow-theme-sm">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'cards'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                  <RectangleStackIcon className="h-[18px] w-[18px]" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'table'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                  <TableCellsIcon className="h-[18px] w-[18px]" />
                </button>
              </div>

              {/* Empty Inbox Button */}
              {messages.length > 0 && canDelete && (
                <button
                  onClick={handleEmptyInbox}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <TrashIcon className="h-[18px] w-[18px]" />
                  {t('contact.empty.inbox')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-theme-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center relative">
                <EnvelopeIcon className="h-6 w-6 text-white" />
                {stats.new > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {stats.new}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('contact.stats.total') || 'Total Messages'}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-theme-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <EnvelopeIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('contact.status.new')}</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.new}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-theme-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-500 to-slate-600 flex items-center justify-center">
                <EnvelopeOpenIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('contact.status.read')}</p>
                <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.read}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-theme-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <ArchiveBoxIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('contact.status.archived')}</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.archived}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm border border-gray-100 dark:border-gray-700 p-5 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Search */}
            <div className="flex-1 w-full lg:w-auto">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('contact.search.placeholder') || 'Search by name, email or message...'}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                />
              </div>
            </div>

            {/* Status Filter Pills */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${statusFilter === 'ALL'
                  ? 'bg-primary text-white shadow-md shadow-primary/25'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                {t('contact.admin.filters.all')} ({stats.total})
              </button>
              {(['NEW', 'READ', 'ARCHIVED'] as const).map((status) => {
                const config = statusConfig[status];
                const count = status === 'NEW' ? stats.new : status === 'READ' ? stats.read : stats.archived;
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${statusFilter === status
                      ? `bg-gradient-to-r ${config.gradient} text-white shadow-md`
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                  >
                    <config.Icon className="h-[18px] w-[18px]" />
                    {t(`contact.status.${status.toLowerCase()}`)} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center animate-pulse">
              <ArrowPathIcon className="h-8 w-8 text-white animate-spin" />
            </div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">{t('loading')}</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm border border-gray-100 dark:border-gray-700">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center mb-6">
              <InboxIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('contact.admin.no_messages')}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
              {t('contact.admin.no_messages_desc') || 'No contact messages found for the selected filter.'}
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          /* Timeline Cards View */
          <div className="space-y-6">
            {Object.entries(groupedMessages).map(([date, dateMessages]) => (
              <div key={date}>
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <CalendarDaysIcon className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{date}</p>
                    <p className="text-xs text-gray-500">{dateMessages.length} message{dateMessages.length > 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700 ml-4" />
                </div>

                {/* Message Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 ml-5 pl-8 border-l-2 border-gray-200 dark:border-gray-700">
                  {dateMessages.map((message) => {
                    const config = statusConfig[message.status];
                    return (
                      <div
                        key={message.id}
                        className="group bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-theme-lg hover:border-primary/20 transition-all duration-300 cursor-pointer"
                        onClick={() => handleView(message)}
                      >
                        <div className={`h-1.5 bg-gradient-to-r ${config.gradient}`} />

                        <div className="p-5">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>
                                <config.Icon className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">{message.name}</p>
                                <a
                                  href={`mailto:${message.email}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs text-primary hover:underline"
                                >
                                  {message.email}
                                </a>
                              </div>
                            </div>
                            <ContactMessageStatusBadge status={message.status} />
                          </div>

                          {/* Message Preview */}
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">{message.message}</p>

                          {/* Meta Info */}
                          <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                              {message.ticket && (
                                <Link
                                  href={`/tickets/${message.ticket.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-1 text-primary hover:underline"
                                >
                                  <TicketIcon className="h-4 w-4" />
                                  {message.ticket.ticketNumber}
                                </Link>
                              )}
                              <div className="flex items-center gap-1">
                                <ClockIcon className="h-4 w-4" />
                                {format(new Date(message.createdAt), 'HH:mm')}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {message.status === 'NEW' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusUpdate(message.id, 'READ');
                                  }}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10"
                                  title={t('contact.admin.mark_read')}
                                >
                                  <CheckIcon className="h-[18px] w-[18px]" />
                                </button>
                              )}
                              {message.status !== 'ARCHIVED' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusUpdate(message.id, 'ARCHIVED');
                                  }}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                  title={t('contact.admin.archive')}
                                >
                                  <ArchiveBoxIcon className="h-[18px] w-[18px]" />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(message);
                                  }}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  title={t('delete')}
                                >
                                  <TrashIcon className="h-[18px] w-[18px]" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('name')}</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('contact.detail.email')}</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('contact.detail.message')}</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('contact.detail.ticket')}</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('status')}</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('contact.detail.received')}</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredMessages.map((message) => {
                    const config = statusConfig[message.status];
                    return (
                      <tr
                        key={message.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                        onClick={() => handleView(message)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                              <config.Icon className="h-4 w-4 text-white" />
                            </div>
                            <p className="font-medium text-gray-900 dark:text-white">{message.name}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <a
                            href={`mailto:${message.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm text-primary hover:underline"
                          >
                            {message.email}
                          </a>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{message.message}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {message.ticket ? (
                            <Link
                              href={`/tickets/${message.ticket.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-sm text-primary hover:underline"
                            >
                              {message.ticket.ticketNumber}
                            </Link>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <ContactMessageStatusBadge status={message.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-600 dark:text-gray-300">{format(new Date(message.createdAt), 'PP')}</p>
                          <p className="text-xs text-gray-500">{format(new Date(message.createdAt), 'p')}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleView(message);
                              }}
                              className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                              title={t('contact.admin.view')}
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            {message.status === 'NEW' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusUpdate(message.id, 'READ');
                                }}
                                className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                                title={t('contact.admin.mark_read')}
                              >
                                <CheckIcon className="h-5 w-5" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(message);
                                }}
                                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title={t('delete')}
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
    </div>
  );
}
