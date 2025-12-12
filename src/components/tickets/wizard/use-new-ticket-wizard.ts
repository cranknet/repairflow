import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { getCurrencySymbol } from '@/lib/currency';
import { DeviceData, CustomerData, TicketDetailsData } from './types';
import { STEPS } from './constants';

interface UseNewTicketWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function useNewTicketWizard({ isOpen, onClose, onSuccess }: UseNewTicketWizardProps) {
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

    return {
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
    };
}
