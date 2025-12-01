'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { useRouter } from 'next/navigation';
import { TicketStatusBadge } from '@/components/tickets/ticket-status-badge';

interface CreateReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId?: string; // Optional ticket ID to prefill modal
}

export function CreateReturnModal({ isOpen, onClose, ticketId }: CreateReturnModalProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isLoadingTicket, setIsLoadingTicket] = useState(false);
  const [ticketFetchError, setTicketFetchError] = useState<string | null>(null);
  const [returnData, setReturnData] = useState({
    reason: '',
    refundAmount: 0,
    returnedTo: '',
    notes: '',
  });

  // Fetch ticket when ticketId prop is provided
  useEffect(() => {
    if (!isOpen || !ticketId) {
      return;
    }

    // If ticket is already loaded and matches ticketId, don't refetch
    if (selectedTicket && selectedTicket.id === ticketId) {
      return;
    }

    const fetchTicket = async () => {
      setIsLoadingTicket(true);
      setTicketFetchError(null);
      try {
        const response = await fetch(`/api/tickets/${ticketId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setTicketFetchError(t('ticketNotFound'));
          } else {
            setTicketFetchError(t('failedToLoadTicket'));
          }
          return;
        }
        const ticket = await response.json();
        
        // Transform ticket data to match expected format
        const ticketData = {
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          status: ticket.status,
          deviceBrand: ticket.deviceBrand,
          deviceModel: ticket.deviceModel,
          finalPrice: ticket.finalPrice,
          estimatedPrice: ticket.estimatedPrice,
          customer: {
            id: ticket.customer.id,
            name: ticket.customer.name,
            phone: ticket.customer.phone,
          },
        };
        
        setSelectedTicket(ticketData);
      } catch (error) {
        console.error('Error fetching ticket:', error);
        setTicketFetchError(t('errorLoadingTicket'));
      } finally {
        setIsLoadingTicket(false);
      }
    };

    fetchTicket();
  }, [isOpen, ticketId, selectedTicket, t]);

  // Debounce search (only when ticketId is not provided)
  useEffect(() => {
    if (!isOpen || ticketId) {
      // Reset state when modal closes or when ticketId is provided
      if (!isOpen) {
        setSearchQuery('');
        setSearchResults([]);
        setSelectedTicket(null);
        setReturnData({ reason: '', refundAmount: 0, returnedTo: '', notes: '' });
        setTicketFetchError(null);
      }
      return;
    }

    if (selectedTicket) {
      // If ticket is selected, don't search
      return;
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/tickets/search?q=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.tickets || []);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Error searching tickets:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, isOpen, selectedTicket, ticketId]);

  useEffect(() => {
    if (selectedTicket) {
      // Reset form when ticket is selected
      const maxRefund = selectedTicket.finalPrice || selectedTicket.estimatedPrice || 0;
      setReturnData({ 
        reason: '', 
        refundAmount: maxRefund,
        returnedTo: '',
        notes: '',
      });
    }
  }, [selectedTicket]);

  const handleUseFullAmount = () => {
    const maxRefund = selectedTicket?.finalPrice || selectedTicket?.estimatedPrice || 0;
    setReturnData({ ...returnData, refundAmount: maxRefund });
  };

  const handleTicketSelect = (ticket: any) => {
    setSelectedTicket(ticket);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleClearSelection = () => {
    setSelectedTicket(null);
    setSearchQuery('');
    setSearchResults([]);
    setReturnData({ reason: '', refundAmount: 0, returnedTo: '', notes: '' });
    setTicketFetchError(null);
  };

  const handleRetryFetch = () => {
    if (ticketId) {
      setTicketFetchError(null);
      // Trigger refetch by clearing selectedTicket temporarily
      setSelectedTicket(null);
    }
  };

  const handleSubmitReturn = async () => {
    // Validate ticket is selected
    if (!selectedTicket) {
      toast({
        title: t('error'),
        description: t('selectTicketToContinue'),
        variant: 'destructive',
      });
      return;
    }

    // Validate ticket status is REPAIRED
    if (selectedTicket?.status !== 'REPAIRED') {
      toast({
        title: t('error'),
        description: t('onlyRepairedTicketsCanBeReturned'),
        variant: 'destructive',
      });
      return;
    }

    if (!returnData.reason.trim()) {
      toast({
        title: t('error'),
        description: t('pleaseProvideReasonForReturn'),
        variant: 'destructive',
      });
      return;
    }

    if (returnData.refundAmount <= 0) {
      toast({
        title: t('error'),
        description: t('refundAmountMustBeGreaterThanZero'),
        variant: 'destructive',
      });
      return;
    }

    const maxRefund = selectedTicket?.finalPrice || selectedTicket?.estimatedPrice || 0;
    if (returnData.refundAmount > maxRefund) {
      toast({
        title: t('error'),
        description: t('refundAmountCannotExceedTicketPrice').replace('{amount}', maxRefund.toString()),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          reason: returnData.reason,
          refundAmount: returnData.refundAmount,
          returnedTo: returnData.returnedTo.trim() || undefined,
          notes: returnData.notes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        // Handle 409 Conflict specially
        if (response.status === 409) {
          throw new Error(error.error || t('conflictReturnExists'));
        }
        throw new Error(error.error || 'Failed to create return');
      }

      toast({
        title: t('success'),
        description: t('returnRequestCreatedSuccessfully'),
      });

      setReturnData({ reason: '', refundAmount: 0, returnedTo: '', notes: '' });
      setSelectedTicket(null);
      setSearchQuery('');
      setSearchResults([]);
      onClose();
      router.refresh();
    } catch (error) {
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : t('failedToCreateReturnRequest'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const maxRefund = selectedTicket?.finalPrice || selectedTicket?.estimatedPrice || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('createReturn')}</DialogTitle>
          <DialogDescription>
            {selectedTicket 
              ? t('createReturnFor') + ' ' + selectedTicket.ticketNumber
              : t('searchTicketsForReturn')
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Loading state when fetching ticket by ID */}
          {ticketId && isLoadingTicket && (
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              {t('loadingTicketData')}
            </div>
          )}

          {/* Error state when ticket fetch fails */}
          {ticketId && ticketFetchError && !isLoadingTicket && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200 mb-2">
                {ticketFetchError}
              </p>
              <Button
                onClick={handleRetryFetch}
                size="sm"
                variant="outlined"
                type="button"
              >
                {t('retry')}
              </Button>
            </div>
          )}

          {/* Search Section - shown when no ticket is selected and no ticketId prop */}
          {!selectedTicket && !ticketId && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="ticket-search">{t('searchByCustomerOrTicketId')}</Label>
                <Input
                  id="ticket-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="mt-1"
                />
              </div>

              {/* Search Results */}
              {isSearching && (
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  {t('searchingTickets')}
                </div>
              )}

              {!isSearching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  {t('noRepairedTicketsFound')}
                </div>
              )}

              {!isSearching && searchResults.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                  {searchResults.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => handleTicketSelect(ticket)}
                      className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{t('ticketNumber')}: {ticket.ticketNumber}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {t('customer')}: {ticket.customer.name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {ticket.deviceBrand} {ticket.deviceModel}
                          </div>
                          <div className="mt-1">
                            <TicketStatusBadge status={ticket.status} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery.trim().length < 2 && (
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  {t('searchPlaceholder')}
                </div>
              )}
            </div>
          )}

          {/* Form Section - shown when ticket is selected */}
          {selectedTicket && (
            <>
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm">{t('ticketNumber')}: {selectedTicket.ticketNumber}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedTicket.customer.name} • {selectedTicket.deviceBrand} {selectedTicket.deviceModel}
                  </div>
                </div>
                {/* Only show clear selection when not opened from ticket view (no ticketId) */}
                {!ticketId && (
                  <Button
                    onClick={handleClearSelection}
                    size="sm"
                    variant="outlined"
                    type="button"
                  >
                    {t('clearSelection')}
                  </Button>
                )}
              </div>

              {selectedTicket.status !== 'REPAIRED' && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {t('ticketCannotBeReturned').replace('{status}', selectedTicket.status)}
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="return-reason">{t('reason')} *</Label>
                <textarea
                  id="return-reason"
                  value={returnData.reason}
                  onChange={(e) => setReturnData({ ...returnData, reason: e.target.value })}
                  rows={3}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 mt-1"
                  placeholder={t('reasonForReturn')}
                />
              </div>

              <div>
                <Label htmlFor="returned-to">{t('returnedTo')}</Label>
                <Input
                  id="returned-to"
                  type="text"
                  value={returnData.returnedTo}
                  onChange={(e) => setReturnData({ ...returnData, returnedTo: e.target.value })}
                  placeholder={t('returnedToPlaceholder')}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="return-notes">{t('additionalNotes')}</Label>
                <textarea
                  id="return-notes"
                  value={returnData.notes}
                  onChange={(e) => setReturnData({ ...returnData, notes: e.target.value })}
                  rows={3}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 mt-1"
                  placeholder={t('additionalNotesPlaceholder')}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="refund-amount">{t('refundAmount')} *</Label>
                  <Button 
                    onClick={handleUseFullAmount} 
                    size="sm" 
                    variant="outlined" 
                    type="button"
                  >
                    {t('useFullAmount')}
                  </Button>
                </div>
                <div className="space-y-2">
                  <Input
                    id="refund-amount"
                    type="number"
                    min="0"
                    max={maxRefund}
                    step="0.01"
                    value={returnData.refundAmount}
                    onChange={(e) => setReturnData({ ...returnData, refundAmount: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('ticketPriceMaxRefund').replace('${amount}', maxRefund.toFixed(2))}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outlined" onClick={onClose} disabled={isSubmitting}>
            {t('cancel')}
          </Button>
          {selectedTicket && (
            <Button 
              onClick={handleSubmitReturn} 
              disabled={isSubmitting || selectedTicket.status !== 'REPAIRED'}
            >
              {isSubmitting ? t('loading') : t('submitReturn')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
