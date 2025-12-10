'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { QuickActionsBar } from './quick-actions-bar';
import { NewTicketWizard } from '@/components/tickets/new-ticket-wizard';

export function DashboardQuickActions() {
    const router = useRouter();
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    const handleNewTicket = useCallback(() => {
        setIsWizardOpen(true);
    }, []);

    const handleWizardClose = useCallback(() => {
        setIsWizardOpen(false);
    }, []);

    const handleWizardSuccess = useCallback(() => {
        setIsWizardOpen(false);
        router.refresh();
    }, [router]);

    return (
        <>
            <QuickActionsBar onNewTicket={handleNewTicket} />
            <NewTicketWizard
                isOpen={isWizardOpen}
                onClose={handleWizardClose}
                onSuccess={handleWizardSuccess}
            />
        </>
    );
}
