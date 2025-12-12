'use client';

import { useLanguage } from '@/contexts/language-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

// Wizard Logic & Types
import { useNewTicketWizard } from './wizard/use-new-ticket-wizard';
import { NewTicketWizardProps } from './wizard/types';

// UI Components
import { WizardStepIndicator } from './wizard/WizardStepIndicator';
import { WizardNavigation } from './wizard/WizardNavigation';
import { StepDeviceDetection } from './wizard/step-device-detection';
import { StepCustomer } from './wizard/step-customer';
import { StepTicketDetails } from './wizard/step-ticket-details';

export function NewTicketWizard(props: NewTicketWizardProps) {
  const { t } = useLanguage();
  const {
    currentStep,
    deviceData,
    customerData,
    ticketDetails,
    isSubmitting,
    currencySymbol,
    setDeviceData,
    setCustomerData,
    setTicketDetails,
    handleNext,
    handleBack,
    handleSubmit,
    handleClose,
    canGoNext,
    canGoBack,
    isLastStep,
  } = useNewTicketWizard(props);

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <StepDeviceDetection
            data={deviceData}
            onChange={setDeviceData}
          />
        );
      case 1:
        return (
          <StepCustomer
            data={customerData}
            onChange={setCustomerData}
          />
        );
      case 2:
        return (
          <StepTicketDetails
            data={ticketDetails}
            onChange={setTicketDetails}
            currencySymbol={currencySymbol}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={props.isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-2 sm:pb-4">
          <DialogTitle className="text-lg sm:text-xl">{t('createNewTicket')}</DialogTitle>
          <DialogDescription className="text-sm">{t('createNewRepairTicket')}</DialogDescription>
        </DialogHeader>

        <WizardStepIndicator currentStep={currentStep} />

        <div className="min-h-[300px] sm:min-h-[400px]">
          {renderStepContent()}
        </div>

        <WizardNavigation
          onBack={handleBack}
          onNext={handleNext}
          onSubmit={handleSubmit}
          onCancel={handleClose}
          canGoBack={canGoBack}
          canGoNext={canGoNext}
          isLastStep={isLastStep}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}

// Export types for consumers if needed (though they should use the separate types file now)
export type { DeviceData, CustomerData, TicketDetailsData } from './wizard/types';