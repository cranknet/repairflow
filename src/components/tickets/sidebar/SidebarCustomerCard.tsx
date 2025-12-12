'use client';

import { useLanguage } from '@/contexts/language-context';
import { CustomerProfileButton } from '@/components/customers/customer-profile-button';
import { CustomerContactActions } from '@/components/customers/customer-contact-actions';

interface SidebarCustomerCardProps {
    customer: {
        id: string;
        name: string;
        phone: string;
        email: string | null;
        address?: string | null;
        city?: string | null;
        state?: string | null;
        zip?: string | null;
        notes?: string | null;
        createdAt?: Date | string;
        tickets?: any[];
        _count?: { tickets: number };
    };
    ticketData: {
        ticketNumber: string;
        trackingCode: string;
        finalPrice?: number;
    };
}

export function SidebarCustomerCard({ customer, ticketData }: SidebarCustomerCardProps) {
    const { t } = useLanguage(); // Although not explicitly used for text in the card, might be needed later or by subcomponents if they were here.
    // Actually, checking the original code, 't' wasn't used inside the Customer Card block except maybe implicitly?
    // "t('customer')" wasn't there. It just showed the name.
    // Wait, let me double check the original file content provided.
    // ...
    // <h3 className="font-semibold truncate">{ticket.customer.name}</h3>
    // ...
    // No 't' usage visible in the snippet for this card specifically.

    // Prepare customer object for ProfileButton
    const profileCustomer = {
        ...customer,
        createdAt: typeof customer.createdAt === 'string'
            ? customer.createdAt
            : customer.createdAt?.toISOString() || new Date().toISOString(),
        tickets: customer.tickets?.map((t: any) => ({
            ...t,
            createdAt: typeof t.createdAt === 'string' ? t.createdAt : t.createdAt?.toISOString(),
        })),
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                        {customer.name.charAt(0).toUpperCase()}
                    </span>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{customer.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{customer.phone}</p>
                    {customer.email && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 truncate">{customer.email}</p>
                    )}
                </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 flex-wrap">
                <CustomerContactActions
                    phone={customer.phone}
                    email={customer.email}
                    customerName={customer.name}
                    ticketData={{
                        ticketNumber: ticketData.ticketNumber,
                        trackingCode: ticketData.trackingCode,
                        finalPrice: ticketData.finalPrice,
                    }}
                />
                <CustomerProfileButton customer={profileCustomer} />
            </div>
        </div>
    );
}
