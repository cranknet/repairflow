'use client';

import { format } from 'date-fns';
import { useLanguage } from '@/contexts/language-context';
import { TicketChatButton } from './ticket-chat-button';

// Sub-components
import { SidebarDeviceCard } from './sidebar/SidebarDeviceCard';
import { SidebarCustomerCard } from './sidebar/SidebarCustomerCard';
import { SidebarPricingCard } from './sidebar/SidebarPricingCard';
import { SidebarTrackingCard } from './sidebar/SidebarTrackingCard';
import { SidebarAssignmentCard } from './sidebar/SidebarAssignmentCard';

interface TicketSidebarProps {
    ticket: {
        id: string;
        ticketNumber: string;
        status: string;
        priority: string;
        trackingCode: string;
        deviceBrand: string;
        deviceModel: string;
        deviceIssue: string;
        estimatedPrice: number;
        finalPrice: number | null;
        paid: boolean;
        createdAt: Date | string;
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
        assignedTo: { id: string; name: string | null; username: string } | null;
    };
    userRole: string;
}

export function TicketSidebar({ ticket, userRole }: TicketSidebarProps) {
    const { t } = useLanguage();

    return (
        <div className="space-y-4">
            <SidebarDeviceCard
                deviceBrand={ticket.deviceBrand}
                deviceModel={ticket.deviceModel}
                deviceIssue={ticket.deviceIssue}
                priority={ticket.priority}
            />

            <SidebarCustomerCard
                customer={ticket.customer}
                ticketData={{
                    ticketNumber: ticket.ticketNumber,
                    trackingCode: ticket.trackingCode,
                    finalPrice: ticket.finalPrice || undefined,
                }}
            />

            <SidebarPricingCard
                estimatedPrice={ticket.estimatedPrice}
                finalPrice={ticket.finalPrice}
                paid={ticket.paid}
            />

            <SidebarTrackingCard
                trackingCode={ticket.trackingCode}
            />

            <SidebarAssignmentCard
                ticket={ticket}
                userRole={userRole}
            />

            <TicketChatButton
                ticketId={ticket.id}
                ticketNumber={ticket.ticketNumber}
            />

            {/* Created Date */}
            <div className="text-center text-xs text-gray-500 dark:text-gray-500 py-2">
                {t('createdAt')}: {format(new Date(ticket.createdAt), 'MMM dd, yyyy HH:mm')}
            </div>
        </div>
    );
}