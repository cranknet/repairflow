/**
 * Recipient selection logic for notifications
 */

import { prisma } from '../prisma';
import { EventPayload } from '../events/types';

/**
 * Get list of user IDs who should receive this notification
 */
export async function getNotificationRecipients(event: EventPayload): Promise<string[]> {
  const recipients: string[] = [];
  
  // Get all users who might be interested
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      role: true,
      notificationPreferences: {
        where: {
          entityType: event.entityType,
          action: event.action,
        },
      },
    },
  });

  for (const user of allUsers) {
    // Check if user has preference disabled
    const preference = user.notificationPreferences[0];
    if (preference && !preference.enabled) {
      continue; // Skip if disabled
    }

    // Check permissions based on entity type
    if (!hasPermission(user.id, user.role, event)) {
      continue;
    }

    // Exclude actor unless self-notify is enabled (for now, we'll include them)
    // TODO: Add self-notify preference check
    if (user.id === event.actorId) {
      // Check if self-notify is enabled (default to true for now)
      continue; // Skip actor by default
    }

    recipients.push(user.id);
  }

  // Special handling for ticket-related events
  if (event.ticketId) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: event.ticketId },
      select: {
        assignedToId: true,
        customerId: true,
      },
    });

    if (ticket) {
      // Always include assigned technician
      if (ticket.assignedToId && !recipients.includes(ticket.assignedToId)) {
        recipients.push(ticket.assignedToId);
      }
    }
  }

  // For customer events, include all admins/staff
  if (event.entityType === 'customer') {
    const adminStaff = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'STAFF'] },
      },
      select: { id: true },
    });
    
    for (const user of adminStaff) {
      if (!recipients.includes(user.id)) {
        recipients.push(user.id);
      }
    }
  }

  // For payment events, include accounting roles (admin/staff)
  if (event.entityType === 'payment') {
    const accountingUsers = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'STAFF'] },
      },
      select: { id: true },
    });
    
    for (const user of accountingUsers) {
      if (!recipients.includes(user.id)) {
        recipients.push(user.id);
      }
    }
  }

  return [...new Set(recipients)]; // Remove duplicates
}

/**
 * Check if user has permission to view the entity
 */
function hasPermission(userId: string, userRole: string, event: EventPayload): boolean {
  // Admins can see everything
  if (userRole === 'ADMIN') {
    return true;
  }

  // Staff can see most things
  if (userRole === 'STAFF') {
    return true;
  }

  // For tickets, check if user is assigned
  if (event.entityType === 'ticket' || event.entityType === 'repairjob') {
    // Will be handled by ticket-specific logic
    return true;
  }

  return false;
}


