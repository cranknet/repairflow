'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { BellIcon, TrashIcon } from '@heroicons/react/24/outline';
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
  } | null;
}

interface NotificationsDropdownProps {
  onClose: () => void;
  onNotificationRead: () => void;
}

interface SwipeableNotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (notification: Notification) => void;
}

function SwipeableNotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
}: SwipeableNotificationItemProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isDragging = useRef(false);
  const SWIPE_THRESHOLD = 80; // Minimum distance to trigger delete
  const DELETE_THRESHOLD = 120; // Distance to auto-delete

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = touchStartX.current - currentX;
    const deltaY = Math.abs(touchStartY.current - currentY);

    // Only allow horizontal swipe (prevent vertical scrolling interference)
    if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > 10) {
      isDragging.current = true;
      e.preventDefault();
      // Only allow swiping left (negative deltaX)
      if (deltaX > 0) {
        setSwipeOffset(-deltaX);
      }
    }
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null) return;

    if (Math.abs(swipeOffset) >= DELETE_THRESHOLD) {
      // Auto-delete if swiped far enough
      handleDelete();
    } else if (Math.abs(swipeOffset) >= SWIPE_THRESHOLD) {
      // Show delete button if swiped enough
      setSwipeOffset(-SWIPE_THRESHOLD);
    } else {
      // Reset if not swiped enough
      setSwipeOffset(0);
    }

    touchStartX.current = null;
    touchStartY.current = null;
    isDragging.current = false;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    touchStartX.current = e.clientX;
    touchStartY.current = e.clientY;
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    
    const deltaX = touchStartX.current - e.clientX;
    const deltaY = Math.abs(touchStartY.current - e.clientY);

    // Only allow horizontal swipe (prevent vertical scrolling interference)
    if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > 10) {
      isDragging.current = true;
      // Only allow swiping left (negative deltaX)
      if (deltaX > 0) {
        setSwipeOffset(-deltaX);
      }
    }
  };

  const handleMouseUp = () => {
    if (touchStartX.current === null) return;

    if (Math.abs(swipeOffset) >= DELETE_THRESHOLD) {
      handleDelete();
    } else if (Math.abs(swipeOffset) >= SWIPE_THRESHOLD) {
      setSwipeOffset(-SWIPE_THRESHOLD);
    } else {
      setSwipeOffset(0);
    }

    touchStartX.current = null;
    touchStartY.current = null;
    isDragging.current = false;
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    onDelete(notification.id);
  };

  const handleItemClick = (e: React.MouseEvent) => {
    // Don't trigger click if we were dragging
    if (isDragging.current) {
      e.preventDefault();
      return;
    }
    onClick(notification);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Delete button background */}
      <div
        className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-red-500 text-white px-4"
        style={{
          width: `${SWIPE_THRESHOLD}px`,
          transform: `translateX(${swipeOffset < -SWIPE_THRESHOLD ? 0 : 100}%)`,
          transition: swipeOffset === 0 ? 'transform 0.2s ease-out' : 'none',
        }}
      >
        <TrashIcon className="h-5 w-5" />
      </div>

      {/* Notification item */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleItemClick}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: swipeOffset === 0 ? 'transform 0.2s ease-out' : 'none',
        }}
        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
          !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
        } ${isDeleting ? 'opacity-50' : ''}`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'}`}>
              {notification.message}
            </p>
            {notification.ticket && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Ticket: {notification.ticket.ticketNumber}
              </p>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {format(new Date(notification.createdAt), 'MMM dd, yyyy HH:mm')}
            </p>
          </div>
          {!notification.read && (
            <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
          )}
        </div>
      </div>
    </div>
  );
}

export function NotificationsDropdown({ onClose, onNotificationRead }: NotificationsDropdownProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/notifications?limit=10');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      } else {
        // If error, set empty array
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        onNotificationRead();
      } else {
        console.error('Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        onNotificationRead();
        toast({
          title: 'Success',
          description: 'Notification deleted',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete notification',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive',
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        onNotificationRead();
        toast({
          title: 'Success',
          description: 'All notifications marked as read',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to mark all as read',
        });
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark all as read',
      });
    }
  };

  const getNotificationDeepLink = (notification: Notification): string | null => {
    // Ticket-related notifications
    if (notification.ticketId) {
      return `/tickets/${notification.ticketId}`;
    }
    
    // Payment notifications link to the ticket
    if (notification.type === 'PAYMENT_STATUS_CHANGE' && notification.ticketId) {
      return `/tickets/${notification.ticketId}`;
    }
    
    return null;
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    const deepLink = getNotificationDeepLink(notification);
    if (deepLink) {
      router.push(deepLink);
      onClose();
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="absolute right-0 mt-2 w-80 rounded-lg bg-white shadow-lg border border-gray-200 z-50">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <BellIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500 dark:text-gray-400">No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map((notification) => (
              <SwipeableNotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
                onClick={handleNotificationClick}
              />
            ))}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/notifications"
            onClick={onClose}
            className="block text-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}

