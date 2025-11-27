'use client';

import { Button } from '@/components/ui/button';
import { PhoneIcon, EnvelopeIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/components/ui/use-toast';

interface CustomerContactActionsProps {
  phone: string;
  email?: string | null;
  customerName: string;
  ticketData?: {
    ticketNumber: string;
    trackingCode: string;
    finalPrice?: number;
  };
}

export function CustomerContactActions({
  phone,
  email,
  customerName,
  ticketData,
}: CustomerContactActionsProps) {
  const { toast } = useToast();

  const handleCall = () => {
    window.location.href = `tel:${phone}`;
  };

  const handleEmail = () => {
    if (email) {
      const subject = ticketData
        ? `Re: Repair Ticket ${ticketData.ticketNumber}`
        : 'Repair Shop Inquiry';
      const body = ticketData
        ? `Hello ${customerName},\n\nRegarding your repair ticket ${ticketData.ticketNumber} (Tracking: ${ticketData.trackingCode})...`
        : `Hello ${customerName},\n\n`;
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  };

  const handleSMS = async () => {
    // This will open the SMS app or trigger SMS functionality
    // For web, we can use sms: protocol or show SMS modal
    if (navigator.userAgent.match(/Mobile|Android|iPhone|iPad/i)) {
      window.location.href = `sms:${phone}`;
    } else {
      // On desktop, copy phone number to clipboard
      try {
        await navigator.clipboard.writeText(phone);
        toast({
          title: 'Phone number copied',
          description: `Phone number ${phone} copied to clipboard. Use your messaging app to send SMS.`,
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to copy phone number to clipboard',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleCall}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <PhoneIcon className="h-4 w-4" />
        Call
      </Button>
      {email && (
        <Button
          onClick={handleEmail}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <EnvelopeIcon className="h-4 w-4" />
          Email
        </Button>
      )}
      <Button
        onClick={handleSMS}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <ChatBubbleLeftRightIcon className="h-4 w-4" />
        SMS
      </Button>
    </div>
  );
}

