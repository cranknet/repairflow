'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CustomerProfileModal } from './customer-profile-modal';

interface CustomerProfileButtonProps {
  customer: {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    address?: string | null;
    notes?: string | null;
    createdAt: string;
    _count?: {
      tickets: number;
    };
    tickets?: Array<{
      id: string;
      ticketNumber: string;
      status: string;
      deviceBrand: string;
      deviceModel: string;
      createdAt: string;
    }>;
  };
}

export function CustomerProfileButton({ customer }: CustomerProfileButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
        View Customer Profile
      </Button>
      <CustomerProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={customer}
        tickets={customer.tickets || []}
      />
    </>
  );
}

