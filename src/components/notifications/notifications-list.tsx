'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BellIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  ticketId?: string | null;
  ticket?: {
    ticketNumber: string;
    id: string;
  } | null;
}

interface NotificationsListProps {
  notifications: Notification[];
}

export function NotificationsList({ notifications: initialNotifications }: NotificationsListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [filter, setFilter] = useState<'all' | 'unread' | string>('all');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'STATUS_CHANGE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'PRICE_ADJUSTMENT':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'TICKET_CREATED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'USER_CREATED':
      case 'USER_DELETED':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        toast({
          title: t('success'),
          description: 'Notification marked as read',
        });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        toast({
          title: t('success'),
          description: 'All notifications marked as read',
        });
        router.refresh();
      }
    } catch (error) {
      toast({
        title: t('error'),
        description: 'Failed to mark all as read',
        variant: 'destructive',
      });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    setIsDeleting(notificationId);
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        toast({
          title: t('success'),
          description: 'Notification deleted',
        });
      } else {
        throw new Error('Failed to delete notification');
      }
    } catch (error) {
      toast({
        title: t('error'),
        description: 'Failed to delete notification',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const deleteAllRead = async () => {
    try {
      const response = await fetch('/api/notifications?read=true', {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => !n.read));
        toast({
          title: t('success'),
          description: 'Read notifications deleted',
        });
        router.refresh();
      }
    } catch (error) {
      toast({
        title: t('error'),
        description: 'Failed to delete read notifications',
        variant: 'destructive',
      });
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.ticketId) {
      router.push(`/tickets/${notification.ticketId}`);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const uniqueTypes = Array.from(new Set(notifications.map((n) => n.type)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('notifications')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outlined" size="sm">
              <CheckIcon className="h-4 w-4 mr-1" />
              Mark all as read
            </Button>
          )}
          {notifications.filter((n) => n.read).length > 0 && (
            <Button onClick={deleteAllRead} variant="outlined" size="sm">
              <TrashIcon className="h-4 w-4 mr-1" />
              Delete read
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({notifications.length})
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('unread')}
        >
          Unread ({unreadCount})
        </Button>
        {uniqueTypes.map((type) => (
          <Button
            key={type}
            variant={filter === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(type)}
          >
            {type.replace('_', ' ')} ({notifications.filter((n) => n.type === type).length})
          </Button>
        ))}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BellIcon className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications found'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                !notification.read ? 'border-l-4 border-l-blue-500' : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(
                          notification.type
                        )}`}
                      >
                        {notification.type.replace('_', ' ')}
                      </span>
                      {!notification.read && (
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <p className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'}`}>
                      {notification.message}
                    </p>
                    {notification.ticket && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Ticket: {notification.ticket.ticketNumber}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      {format(new Date(notification.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                      >
                        <CheckIcon className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      disabled={isDeleting === notification.id}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

