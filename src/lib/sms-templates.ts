export interface SMSTemplate {
  id: string;
  name: string;
  message: string;
  variables: string[];
  templateId?: string;
  language?: string;
  isActive?: boolean;
}

// Default templates (fallback if database templates not available)
export const DEFAULT_SMS_TEMPLATES: SMSTemplate[] = [
  {
    id: 'ticket_created',
    name: 'Ticket Created',
    message: 'Hello {customerName}, your repair ticket #{ticketNumber} has been created. Tracking code: {trackingCode}. We will update you soon.',
    variables: ['customerName', 'ticketNumber', 'trackingCode'],
    templateId: 'ticket_created',
  },
  {
    id: 'ticket_in_progress',
    name: 'Repair In Progress',
    message: 'Hello {customerName}, your device repair (Ticket #{ticketNumber}) is now in progress. We will keep you updated.',
    variables: ['customerName', 'ticketNumber'],
    templateId: 'ticket_in_progress',
  },
  {
    id: 'ticket_waiting_parts',
    name: 'Waiting for Parts',
    message: 'Hello {customerName}, your repair (Ticket #{ticketNumber}) is waiting for parts. We will notify you when parts arrive.',
    variables: ['customerName', 'ticketNumber'],
    templateId: 'ticket_waiting_parts',
  },
  {
    id: 'ticket_repaired',
    name: 'Device Repaired',
    message: 'Hello {customerName}, your device repair (Ticket #{ticketNumber}) is complete! Final price: ${finalPrice}. Please come to collect your device.',
    variables: ['customerName', 'ticketNumber', 'finalPrice'],
    templateId: 'ticket_repaired',
  },
  {
    id: 'ticket_completed',
    name: 'Ticket Completed',
    message: 'Hello {customerName}, your repair ticket #{ticketNumber} has been completed. Thank you for choosing our service!',
    variables: ['customerName', 'ticketNumber'],
    templateId: 'ticket_completed',
  },
  {
    id: 'payment_reminder',
    name: 'Payment Reminder',
    message: 'Hello {customerName}, reminder: Payment pending for ticket #{ticketNumber}. Amount: ${finalPrice}. Please visit us to complete payment.',
    variables: ['customerName', 'ticketNumber', 'finalPrice'],
    templateId: 'payment_reminder',
  },
  {
    id: 'custom',
    name: 'Custom Message',
    message: '',
    variables: [],
    templateId: 'custom',
  },
];

// Template IDs that should exist in the system
export const TEMPLATE_IDS = [
  'ticket_created',
  'ticket_in_progress',
  'ticket_waiting_parts',
  'ticket_repaired',
  'ticket_completed',
  'payment_reminder',
];

export function formatSMSTemplate(template: SMSTemplate, data: Record<string, string>): string {
  let message = template.message;
  template.variables.forEach((variable) => {
    const value = data[variable] || `{${variable}}`;
    message = message.replace(new RegExp(`\\{${variable}\\}`, 'g'), value);
  });
  return message;
}

// Fetch templates from API (client-side)
export async function fetchSMSTemplates(language: string = 'en'): Promise<SMSTemplate[]> {
  try {
    const response = await fetch(`/api/sms/templates?language=${language}`);
    if (response.ok) {
      const templates = await response.json();
      return templates.map((t: any) => ({
        ...t,
        variables: typeof t.variables === 'string' ? JSON.parse(t.variables) : t.variables,
      }));
    }
  } catch (error) {
    console.error('Error fetching SMS templates:', error);
  }
  return DEFAULT_SMS_TEMPLATES;
}

