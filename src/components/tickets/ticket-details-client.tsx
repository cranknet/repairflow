'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CompletionSMSPrompt } from './completion-sms-prompt';
import { CreateReturnModal } from '@/components/returns/create-return-modal';
import { AddPartsModal } from './add-parts-modal';
import { TicketStatusControl } from './ticket-status-control';
import { useLanguage } from '@/contexts/language-context';

interface TicketDetailsClientProps {
  ticket: {
    id: string;
    ticketNumber: string;
    status: string;
    paid: boolean;
    finalPrice: number | null;
    estimatedPrice: number;
    outstandingAmount?: number;
    customer: {
      name: string;
      phone: string;
    };
    parts?: Array<{
      id: string;
      partId: string;
      quantity: number;
      part: {
        id: string;
        name: string;
        sku: string;
        unitPrice: number;
      };
    }>;
    trackingCode: string;
    returns?: any[];
  };
  userRole: string;
}

export function TicketDetailsClient({ ticket, userRole }: TicketDetailsClientProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [showPartsModal, setShowPartsModal] = useState(false);
  const [showSMSPrompt, setShowSMSPrompt] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [lastTransitionedStatus, setLastTransitionedStatus] = useState<string | null>(null);

  // Handle status change completion
  const handleStatusChange = () => {
    // Check if we just transitioned to REPAIRED
    if (ticket.status === 'REPAIRED' && lastTransitionedStatus !== 'REPAIRED') {
      setShowPartsModal(true);
      setLastTransitionedStatus('REPAIRED');
    }
    router.refresh();
  };

  // Handle parts modal close
  const handlePartsModalClose = () => {
    setShowPartsModal(false);
    // After closing parts modal, show SMS prompt
    if (ticket.status === 'REPAIRED') {
      setShowSMSPrompt(true);
    }
  };

  // Handle return modal close
  const handleReturnModalClose = () => {
    setShowReturnModal(false);
    router.refresh();
  };

  return (
    <>
      {/* Status Control - Main status management component */}
      <TicketStatusControl
        ticket={ticket}
        userRole={userRole}
        onStatusChange={handleStatusChange}
      />

      {/* Add Parts Modal */}
      <AddPartsModal
        isOpen={showPartsModal}
        onClose={handlePartsModalClose}
        ticketId={ticket.id}
        onSuccess={() => {
          router.refresh();
        }}
        existingParts={ticket.parts as any || []}
      />

      {/* SMS Prompt Modal */}
      <CompletionSMSPrompt
        isOpen={showSMSPrompt}
        onClose={() => setShowSMSPrompt(false)}
        phoneNumber={ticket.customer.phone}
        customerName={ticket.customer.name}
        ticketData={{
          ticketNumber: ticket.ticketNumber,
          trackingCode: ticket.trackingCode,
          finalPrice: ticket.finalPrice || undefined,
        }}
      />

      {/* Return Modal */}
      <CreateReturnModal
        isOpen={showReturnModal}
        onClose={handleReturnModalClose}
        ticketId={ticket.id}
      />
    </>
  );
}
