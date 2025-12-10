'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { getCurrencySymbol } from '@/lib/currency';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  ArrowPathIcon,
  DevicePhoneMobileIcon,
  UserIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { StepDeviceDetection } from './wizard/step-device-detection';
import { StepCustomer } from './wizard/step-customer';
import { StepTicketDetails } from './wizard/step-ticket-details';

// Types for wizard data
export interface DeviceData {
  frontImage: string;
  backImage: string;
  brand: string;
  model: string;
  color: string;
}

export interface CustomerData {
  customerId: string;
  isNewCustomer: boolean;
  newCustomer?: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    notes?: string;
  };
}

export interface TicketDetailsData {
  deviceIssue: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimatedPrice: string;
  assignedToId?: string;
  warrantyDays?: string;
  warrantyText?: string;
  notes?: string;
}

interface NewTicketWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const STEPS = [
  { id: 'device', label: 'stepDeviceDetection' },
  { id: 'customer', label: 'stepCustomer' },
  { id: 'details', label: 'stepTicketDetails' },
] as const;

export function NewTicketWizard({ isOpen, onClose, onSuccess }: NewTicketWizardProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState('$');

  // Wizard data state
  const [deviceData, setDeviceData] = useState<DeviceData>({
    frontImage: '',
    backImage: '',
    brand: '',
    model: '',
    color: '',
  });

  const [customerData, setCustomerData] = useState<CustomerData>({
    customerId: '',
    isNewCustomer: false,
  });

  const [ticketDetails, setTicketDetails] = useState<TicketDetailsData>({
    deviceIssue: '',
    priority: 'MEDIUM',
    estimatedPrice: '0',
  });

  // Fetch currency on mount
  useEffect(() => {
    if (isOpen) {
      fetch('/api/settings/public')
        .then((res) => res.json())
        .then((data) => {
          const currency = data.currency || 'USD';
          setCurrencySymbol(getCurrencySymbol(currency));
        })
        .catch(() => setCurrencySymbol('$'));
    }
  }, [isOpen]);

  // Reset wizard when closed
  const handleClose = useCallback(() => {
    setCurrentStep(0);
    setDeviceData({
      frontImage: '',
      backImage: '',
      brand: '',
      model: '',
      color: '',
    });
    setCustomerData({
      customerId: '',
      isNewCustomer: false,
    });
    setTicketDetails({
      deviceIssue: '',
      priority: 'MEDIUM',
      estimatedPrice: '0',
    });
    onClose();
  }, [onClose]);

  // Step validation
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0: // Device Detection
        return !!(deviceData.brand && deviceData.model);
      case 1: // Customer
        if (customerData.isNewCustomer) {
          return !!(customerData.newCustomer?.name && customerData.newCustomer?.phone);
        }
        return !!customerData.customerId;
      case 2: // Ticket Details
        return !!(
          ticketDetails.deviceIssue &&
          ticketDetails.estimatedPrice &&
          parseFloat(ticketDetails.estimatedPrice) >= 0
        );
      default:
        return false;
    }
  };

  // Navigation
  const canGoNext = isStepValid(currentStep);
  const canGoBack = currentStep > 0;
  const isLastStep = currentStep === STEPS.length - 1;

  const handleNext = () => {
    if (canGoNext && !isLastStep) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (canGoBack) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Submit ticket
  const handleSubmit = async () => {
    if (!isStepValid(currentStep)) return;

    setIsSubmitting(true);
    try {
      let finalCustomerId = customerData.customerId;

      // Create new customer if needed
      if (customerData.isNewCustomer && customerData.newCustomer) {
        const customerResponse = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: customerData.newCustomer.name,
            phone: customerData.newCustomer.phone,
            email: customerData.newCustomer.email || undefined,
            address: customerData.newCustomer.address || undefined,
            notes: customerData.newCustomer.notes || undefined,
          }),
        });

        if (!customerResponse.ok) {
          throw new Error(t('customerCreateFailed'));
        }

        const newCustomer = await customerResponse.json();
        finalCustomerId = newCustomer.id;
      }

      // Create ticket
      const ticketResponse = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: finalCustomerId,
          deviceBrand: deviceData.brand,
          deviceModel: deviceData.model,
          deviceColor: deviceData.color || undefined,
          deviceIssue: ticketDetails.deviceIssue,
          priority: ticketDetails.priority,
          estimatedPrice: parseFloat(ticketDetails.estimatedPrice),
          warrantyDays: ticketDetails.warrantyDays ? parseInt(ticketDetails.warrantyDays) : undefined,
          warrantyText: ticketDetails.warrantyText || undefined,
          assignedToId: ticketDetails.assignedToId || undefined,
          notes: ticketDetails.notes || undefined,
          deviceConditionFront: deviceData.frontImage || undefined,
          deviceConditionBack: deviceData.backImage || undefined,
        }),
      });

      if (!ticketResponse.ok) {
        const errorData = await ticketResponse.json().catch(() => ({ error: 'Failed to create ticket' }));
        throw new Error(errorData.error || 'Failed to create ticket');
      }

      toast({
        title: t('success'),
        description: t('ticketCreated'),
      });

      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      toast({
        title: t('error'),
        description: error.message || t('ticketCreateFailed'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step icons mapping
  const stepIcons = [DevicePhoneMobileIcon, UserIcon, DocumentTextIcon];

  // Render step indicator - mobile responsive with icons and progress bar
  const renderStepIndicator = () => {
    const progress = ((currentStep) / (STEPS.length - 1)) * 100;

    return (
      <div className="mb-6">
        {/* Progress bar background */}
        <div className="relative">
          <div className="flex justify-between items-center relative z-10">
            {STEPS.map((step, index) => {
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              const StepIcon = stepIcons[index];

              return (
                <div key={step.id} className="flex flex-col items-center">
                  {/* Step circle with icon */}
                  <div
                    className={`
                      w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center
                      transition-all duration-300 border-2
                      ${isCompleted
                        ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200 dark:shadow-primary-900/50'
                        : isCurrent
                          ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200 dark:shadow-primary-900/50 scale-110'
                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <CheckIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      <StepIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </div>
                  {/* Step label */}
                  <span
                    className={`
                      mt-2 text-xs sm:text-sm font-medium text-center
                      ${isCompleted || isCurrent
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-500 dark:text-gray-400'
                      }
                    `}
                  >
                    {t(step.label)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress track (behind circles) */}
          <div className="absolute top-5 sm:top-6 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -z-0 mx-5 sm:mx-6" />

          {/* Progress fill */}
          <div
            className="absolute top-5 sm:top-6 left-0 h-0.5 bg-primary-600 transition-all duration-500 -z-0 mx-5 sm:mx-6"
            style={{ width: `calc(${progress}% - ${progress === 100 ? '0px' : '0px'})` }}
          />
        </div>
      </div>
    );
  };

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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-2 sm:pb-4">
          <DialogTitle className="text-lg sm:text-xl">{t('createNewTicket')}</DialogTitle>
          <DialogDescription className="text-sm">{t('createNewRepairTicket')}</DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Step Content */}
        <div className="min-h-[300px] sm:min-h-[400px]">
          {renderStepContent()}
        </div>

        {/* Navigation Footer - Mobile responsive */}
        <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={!canGoBack || isSubmitting}
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{t('previousStep')}</span>
            <span className="sm:hidden">{t('back') || 'Back'}</span>
          </Button>

          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial"
            >
              {t('cancel')}
            </Button>

            {isLastStep ? (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!canGoNext || isSubmitting}
                className="flex items-center justify-center gap-2 flex-1 sm:flex-initial"
              >
                {isSubmitting ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">{t('creating')}</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <CheckIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('createTicket')}</span>
                    <span className="sm:hidden">{t('create') || 'Create'}</span>
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canGoNext}
                className="flex items-center justify-center gap-2 flex-1 sm:flex-initial"
              >
                <span className="hidden sm:inline">{t('nextStep')}</span>
                <span className="sm:hidden">{t('next') || 'Next'}</span>
                <ArrowRightIcon className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

