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

  // Render step indicator
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div key={step.id} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  transition-all duration-200
                  ${
                    isCompleted
                      ? 'bg-primary-600 text-white'
                      : isCurrent
                      ? 'bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-900'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }
                `}
              >
                {isCompleted ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`
                  mt-2 text-xs font-medium max-w-[80px] text-center
                  ${
                    isCurrent
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }
                `}
              >
                {t(step.label)}
              </span>
            </div>

            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div
                className={`
                  w-16 h-0.5 mx-2 mt-[-20px]
                  ${
                    index < currentStep
                      ? 'bg-primary-600'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('createNewTicket')}</DialogTitle>
          <DialogDescription>{t('createNewRepairTicket')}</DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Step Content */}
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>

        {/* Navigation Footer */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={!canGoBack || isSubmitting}
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            {t('previousStep')}
          </Button>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {t('cancel')}
            </Button>

            {isLastStep ? (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!canGoNext || isSubmitting}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    {t('creating')}
                  </>
                ) : (
                  <>
                    <CheckIcon className="w-4 h-4" />
                    {t('createTicket')}
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canGoNext}
                className="flex items-center gap-2"
              >
                {t('nextStep')}
                <ArrowRightIcon className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

