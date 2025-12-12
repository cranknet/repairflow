'use client';

import { useLanguage } from '@/contexts/language-context';
import { TicketAssignment } from '../ticket-assignment';
import { UserIcon } from '@heroicons/react/24/outline';

interface SidebarAssignmentCardProps {
    ticket: any; // Using any here to match the flexible usage in original, but ideally typed
    userRole: string;
}

export function SidebarAssignmentCard({ ticket, userRole }: SidebarAssignmentCardProps) {
    const { t } = useLanguage();

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                <UserIcon className="h-[18px] w-[18px] text-gray-500" />
                {t('assignedTo')}
            </h3>
            <TicketAssignment ticket={ticket} userRole={userRole} />
        </div>
    );
}
