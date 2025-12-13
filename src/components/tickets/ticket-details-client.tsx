'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CompletionSMSPrompt } from './completion-sms-prompt';
import { CreateReturnModal } from '@/components/returns/create-return-modal';
import { AddPartsModal } from './add-parts-modal';
import { TicketPaymentModal } from './ticket-payment-modal';
import { StatusProgressBar } from './status-progress-bar';
import { ServiceOnlyChoiceModal } from './service-only-choice-modal';
import { useLanguage } from '@/contexts/language-context';
import { TicketPrintProvider } from './ticket-print-context';
import { TicketPrintButtons } from './ticket-print-buttons';
import { useToast } from '@/components/ui/use-toast';

interface TicketPart {
  id: string;
  partId: string;
  quantity: number;
  part: {
    id: string;
    name: string;
    sku: string;
    unitPrice: number;
  };
}

interface TicketDetailsClientProps {
  ticket: {
    id: string;
    ticketNumber: string;
    status: string;
    paid: boolean;
    finalPrice: number | null;
    estimatedPrice: number;
    outstandingAmount?: number;
    totalPaid?: number;
    serviceOnly?: boolean;
    customer: {
      name: string;
      phone: string;
    };
    deviceBrand: string;
    deviceModel: string;
    parts?: TicketPart[];
    trackingCode: string;
    returns?: any[];
  };
  userRole: string;
}

export function TicketDetailsClient({ ticket, userRole }: TicketDetailsClientProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const { toast } = useToast();

  // Modal states
  const [showPartsModal, setShowPartsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSMSPrompt, setShowSMSPrompt] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showServiceOnlyChoice, setShowServiceOnlyChoice] = useState(false);
  const [isMarkingServiceOnly, setIsMarkingServiceOnly] = useState(false);

  // Handle status change completion
  const handleStatusChange = () => {
    router.refresh();
  };

  // Handle SMS prompt open (from progress bar)
  const handleOpenSMSPrompt = () => {
    setShowSMSPrompt(true);
  };

  // Handle parts modal open (from progress bar)
  // If ticket is in WAITING_FOR_PARTS, show choice modal first
  const handleOpenPartsModal = () => {
    if (ticket.status === 'WAITING_FOR_PARTS' && !ticket.serviceOnly && (ticket.parts?.length ?? 0) === 0) {
      // Show choice modal for tickets waiting for parts with no parts added
      setShowServiceOnlyChoice(true);
    } else {
      // Directly open parts modal for other cases
      setShowPartsModal(true);
    }
  };

  // Handle parts modal close
  const handlePartsModalClose = () => {
    setShowPartsModal(false);
    router.refresh();
  };

  // Handle payment modal open (from progress bar)
  const handleOpenPaymentModal = () => {
    setShowPaymentModal(true);
  };

  // Handle payment modal close
  const handlePaymentModalClose = () => {
    setShowPaymentModal(false);
    router.refresh();
  };

  // Handle return modal open (from progress bar)
  const handleOpenReturnModal = () => {
    setShowReturnModal(true);
  };

  // Handle return modal close
  const handleReturnModalClose = () => {
    setShowReturnModal(false);
    router.refresh();
  };

  // Handle service-only selection - mark ticket as service only and transition to REPAIRED
  const handleSelectServiceOnly = async () => {
    setIsMarkingServiceOnly(true);
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceOnly: true,
          status: 'REPAIRED',
          statusNotes: t('ticket.serviceOnly.markedAsServiceOnly'),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update ticket');
      }

      toast({
        title: t('success'),
        description: t('ticket.serviceOnly.markedAsServiceOnly'),
      });

      router.refresh();
    } catch (error) {
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : t('failedToUpdateTicket'),
        variant: 'destructive',
      });
    } finally {
      setIsMarkingServiceOnly(false);
    }
  };

  return (
    <TicketPrintProvider ticket={ticket}>
      {/* Status Progress Bar - Main status management component */}
      <StatusProgressBar
        ticket={ticket}
        userRole={userRole}
        onStatusChange={handleStatusChange}
        onOpenPartsModal={handleOpenPartsModal}
        onOpenPaymentModal={handleOpenPaymentModal}
        onOpenReturnModal={handleOpenReturnModal}
        onOpenSMSPrompt={handleOpenSMSPrompt}
      />

      {/* Service Only Choice Modal */}
      <ServiceOnlyChoiceModal
        isOpen={showServiceOnlyChoice}
        onClose={() => setShowServiceOnlyChoice(false)}
        onSelectAddParts={() => setShowPartsModal(true)}
        onSelectServiceOnly={handleSelectServiceOnly}
        isLoading={isMarkingServiceOnly}
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
        ticketStatus={ticket.status}
        deviceName={`${ticket.deviceBrand} ${ticket.deviceModel}`.trim()}
      />

      {/* Payment Modal */}
      <TicketPaymentModal
        isOpen={showPaymentModal}
        onClose={handlePaymentModalClose}
        ticket={{
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          status: ticket.status,
          customer: ticket.customer,
          deviceBrand: ticket.deviceBrand,
          deviceModel: ticket.deviceModel,
          finalPrice: ticket.finalPrice,
          estimatedPrice: ticket.estimatedPrice,
          outstandingAmount: ticket.outstandingAmount,
          totalPaid: ticket.totalPaid,
        }}
        onSuccess={() => {
          router.refresh();
        }}
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
    </TicketPrintProvider>
  );
}

