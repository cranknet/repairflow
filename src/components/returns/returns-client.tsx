'use client';

import { useState } from 'react';
import { ReturnsTable } from './returns-table';
import { NoReturnsFound } from './no-returns-found';
import { CreateReturnModal } from './create-return-modal';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { PlusIcon } from '@heroicons/react/24/outline';

interface ReturnsClientProps {
  returns: any[];
  userRole: string;
}

export function ReturnsClient({ returns, userRole }: ReturnsClientProps) {
  const { t } = useLanguage();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const isAdmin = userRole === 'ADMIN';

  return (
    <>
      <div className="space-y-4">
        {/* Create Return Button - Admin Only */}
        {isAdmin && (
          <div className="flex justify-end">
            <Button onClick={() => setShowCreateModal(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              {t('createReturn')}
            </Button>
          </div>
        )}

        {/* Returns List */}
        <div>
          <h3 className="text-lg font-semibold mb-4">{t('returnRequests')}</h3>
          {returns.length > 0 ? (
            <ReturnsTable returns={returns} userRole={userRole} />
          ) : (
            <NoReturnsFound />
          )}
        </div>
      </div>

      <CreateReturnModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
        }}
      />
    </>
  );
}

