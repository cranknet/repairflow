import { prisma } from './prisma';

export type NotificationType = 
  | 'STATUS_CHANGE' 
  | 'PRICE_ADJUSTMENT' 
  | 'PAYMENT_STATUS_CHANGE'
  | 'ASSIGNMENT' 
  | 'TICKET_CREATED' 
  | 'USER_DELETED' 
  | 'USER_CREATED'
  | 'USER_UPDATED';

interface CreateNotificationParams {
  type: NotificationType;
  message: string;
  userId?: string | null; // If null, notify all admins
  ticketId?: string | null;
}

/**
 * Create a notification for a specific user or all admins
 */
export async function createNotification({
  type,
  message,
  userId,
  ticketId,
}: CreateNotificationParams) {
  try {
    if (userId) {
      // Create notification for specific user
      await prisma.notification.create({
        data: {
          type,
          message,
          userId,
          ticketId: ticketId || null,
        },
      });
    } else {
      // Create notification for all admins
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true },
      });

      await Promise.all(
        admins.map((admin) =>
          prisma.notification.create({
            data: {
              type,
              message,
              userId: admin.id,
              ticketId: ticketId || null,
            },
          })
        )
      );
    }
  } catch (error) {
    console.error('Error creating notification:', error);
    // Don't throw - notifications are not critical
  }
}

/**
 * Get status change message
 */
export function getStatusChangeMessage(
  ticketNumber: string,
  oldStatus: string,
  newStatus: string
): string {
  const statusNames: Record<string, string> = {
    RECEIVED: 'Received',
    IN_PROGRESS: 'In Progress',
    WAITING_FOR_PARTS: 'Waiting for Parts',
    REPAIRED: 'Repaired',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  };

  return `Ticket ${ticketNumber} status changed from ${statusNames[oldStatus] || oldStatus} to ${statusNames[newStatus] || newStatus}`;
}

