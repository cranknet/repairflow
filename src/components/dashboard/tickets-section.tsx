'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DashboardTicketHeader } from './dashboard-ticket-header';
import { DashboardTicketTable } from './dashboard-ticket-table';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths } from 'date-fns';

type PeriodFilter = 'today' | 'thisMonth' | 'lastMonth';

interface TicketsSectionProps {
    tickets: any[];
}

export function TicketsSection({ tickets }: TicketsSectionProps) {
    const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('today');

    const filteredTickets = useMemo(() => {
        const now = new Date();
        let startDate: Date;
        let endDate: Date;

        switch (selectedPeriod) {
            case 'today':
                startDate = startOfDay(now);
                endDate = endOfDay(now);
                break;
            case 'thisMonth':
                startDate = startOfMonth(now);
                endDate = endOfDay(now);
                break;
            case 'lastMonth':
                startDate = startOfMonth(subMonths(now, 1));
                endDate = endOfMonth(subMonths(now, 1));
                break;
            default:
                startDate = startOfDay(now);
                endDate = endOfDay(now);
        }

        return tickets.filter((ticket) => {
            const ticketDate = new Date(ticket.createdAt);
            return ticketDate >= startDate && ticketDate <= endDate;
        });
    }, [tickets, selectedPeriod]);

    return (
        <Card className="overflow-hidden">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800">
                <DashboardTicketHeader
                    selectedPeriod={selectedPeriod}
                    onPeriodChange={setSelectedPeriod}
                />
            </CardHeader>
            <CardContent className="p-0">
                <DashboardTicketTable tickets={filteredTickets} />
            </CardContent>
        </Card>
    );
}
