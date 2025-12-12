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

export interface NewTicketWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}
