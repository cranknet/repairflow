'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ContactForm } from './contact-form';
import { useLanguage } from '@/contexts/language-context';

interface ContactSupportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId?: string;
  customerData?: {
    name?: string;
    email?: string;
    phone?: string | null;
  };
}

export function ContactSupportModal({ open, onOpenChange, ticketId, customerData }: ContactSupportModalProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('contact.form.title')}</DialogTitle>
          <DialogDescription>{t('contact.form.description')}</DialogDescription>
        </DialogHeader>
        <ContactForm 
          ticketId={ticketId} 
          variant="plain" 
          showHeader={false} 
          onSubmitted={() => onOpenChange(false)}
          defaultValues={customerData ? {
            name: customerData.name,
            email: customerData.email,
            phone: customerData.phone || undefined,
          } : undefined}
        />
      </DialogContent>
    </Dialog>
  );
}

