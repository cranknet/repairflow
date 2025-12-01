/**
 * Event system types for notification integration
 */

export type EntityType = 
  | 'customer'
  | 'ticket'
  | 'payment'
  | 'charge'
  | 'repairjob'
  | 'part'
  | 'supplier';

export type Action = 
  | 'created'
  | 'updated'
  | 'deleted'
  | 'status_changed'
  | 'assigned'
  | 'completed'
  | 'used'
  | 'removed'
  | 'added';

export interface EventPayload {
  eventId: string;
  entityType: EntityType;
  entityId: string;
  action: Action;
  actorId: string;
  actorName: string;
  timestamp: Date;
  summary: string;
  details?: string;
  meta?: Record<string, any>;
  customerId?: string;
  ticketId?: string;
  device?: {
    brand?: string;
    model?: string;
    issue?: string;
  };
}

export const EVENT_TYPES = {
  // Customer events
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',
  CUSTOMER_DELETED: 'customer.deleted',
  
  // Ticket events
  TICKET_CREATED: 'ticket.created',
  TICKET_UPDATED: 'ticket.updated',
  TICKET_STATUS_CHANGED: 'ticket.status_changed',
  TICKET_DELETED: 'ticket.deleted',
  
  // Payment events
  PAYMENT_CREATED: 'payment.created',
  
  // Charge events
  CHARGE_ADDED: 'charge.added',
  CHARGE_REMOVED: 'charge.removed',
  
  // RepairJob events (mapped to tickets)
  REPAIRJOB_ASSIGNED: 'repairjob.assigned',
  REPAIRJOB_COMPLETED: 'repairjob.completed',
  REPAIRJOB_UPDATED: 'repairjob.updated',
  
  // Part events
  PART_USED: 'part.used',
  PART_REMOVED: 'part.removed',
  
  // Supplier events
  SUPPLIER_CREATED: 'supplier.created',
  SUPPLIER_UPDATED: 'supplier.updated',
  SUPPLIER_DELETED: 'supplier.deleted',
} as const;


