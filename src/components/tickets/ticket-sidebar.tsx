'use client';

import { format } from 'date-fns';
import { useState } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { TicketAssignment } from './ticket-assignment';
import { CustomerProfileButton } from '@/components/customers/customer-profile-button';
import { CustomerContactActions } from '@/components/customers/customer-contact-actions';

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
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);

    const handleCopyTrackingCode = async () => {
        if (!ticket.trackingCode) return;
        try {
            await navigator.clipboard.writeText(ticket.trackingCode);
            setCopied(true);
            toast({
                title: t('success'),
                description: t('trackingCodeCopied'),
            });
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority.toUpperCase()) {
            case 'HIGH':
            case 'URGENT':
                return 'text-red-600 dark:text-red-400';
            case 'MEDIUM':
                return 'text-amber-600 dark:text-amber-400';
            default:
                return 'text-gray-600 dark:text-gray-400';
        }
    };

    return (
        <div className="space-y-4">
            {/* Device Info Card */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-primary-600 dark:text-primary-400">smartphone</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{t('device')}</h3>
                        <p className="font-medium text-lg truncate">{ticket.deviceBrand} {ticket.deviceModel}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{ticket.deviceIssue}</p>
                    </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <span className="text-xs text-gray-500">{t('priority')}</span>
                    <span className={`text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                    </span>
                </div>
            </div>

            {/* Customer Card */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                            {ticket.customer.name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{ticket.customer.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{ticket.customer.phone}</p>
                        {ticket.customer.email && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 truncate">{ticket.customer.email}</p>
                        )}
                    </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 flex-wrap">
                    <CustomerContactActions
                        phone={ticket.customer.phone}
                        email={ticket.customer.email}
                        customerName={ticket.customer.name}
                        ticketData={{
                            ticketNumber: ticket.ticketNumber,
                            trackingCode: ticket.trackingCode,
                            finalPrice: ticket.finalPrice || undefined,
                        }}
                    />
                    <CustomerProfileButton
                        customer={{
                            ...ticket.customer,
                            createdAt: typeof ticket.customer.createdAt === 'string'
                                ? ticket.customer.createdAt
                                : ticket.customer.createdAt?.toISOString() || new Date().toISOString(),
                            tickets: ticket.customer.tickets?.map((t: any) => ({
                                ...t,
                                createdAt: typeof t.createdAt === 'string' ? t.createdAt : t.createdAt?.toISOString(),
                            })),
                        }}
                    />
                </div>
            </div>

            {/* Pricing Card */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg text-gray-500">payments</span>
                        {t('pricing')}
                    </h3>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${ticket.paid
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                        {ticket.paid ? t('paid') : t('unpaid')}
                    </span>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{t('estimatedPrice')}</span>
                        <span className="font-medium">${ticket.estimatedPrice.toFixed(2)}</span>
                    </div>
                    {ticket.finalPrice !== null && (
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">{t('finalPrice')}</span>
                            <span className="font-bold text-lg text-primary-600 dark:text-primary-400">
                                ${ticket.finalPrice.toFixed(2)}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Tracking Code Card */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg text-gray-500">qr_code</span>
                        {t('trackingCode')}
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm select-all">
                        {ticket.trackingCode}
                    </code>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyTrackingCode}
                        className="flex-shrink-0"
                    >
                        <span className="material-symbols-outlined text-sm">
                            {copied ? 'check' : 'content_copy'}
                        </span>
                    </Button>
                </div>
            </div>

            {/* Assignment Card */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-lg text-gray-500">person</span>
                    {t('assignedTo')}
                </h3>
                <TicketAssignment ticket={ticket} userRole={userRole} />
            </div>

            {/* Created Date */}
            <div className="text-center text-xs text-gray-500 dark:text-gray-500 py-2">
                {t('createdAt')}: {format(new Date(ticket.createdAt), 'MMM dd, yyyy HH:mm')}
            </div>
        </div>
    );
}
