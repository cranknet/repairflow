'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PrinterIcon } from '@heroicons/react/24/outline';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TicketLabel40x20 } from './ticket-label-40x20';
import { TicketLabel80x80 } from './ticket-label-80x80';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/components/ui/use-toast';

export function TicketPrintButtons({ ticket }: { ticket: any }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'40x20' | '80x80' | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Check if invoice can be printed (only for REPAIRED status, or if ticket has returns)
  const hasReturns = ticket.returns && ticket.returns.length > 0;
  const canPrintInvoice = ticket.status === 'REPAIRED' || hasReturns;

  const handleSelectFormat = (format: '40x20' | '80x80') => {
    if (format === '80x80' && !canPrintInvoice) {
      toast({
        title: t('error'),
        description: 'Invoice can only be printed when ticket status is Repaired',
        variant: 'destructive',
      });
      return;
    }
    setSelectedFormat(format);
  };

  const handlePrint = () => {
    if (!printRef.current) return;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = printRef.current.innerHTML;
    const pageSize = selectedFormat === '40x20' ? '40mm 20mm' : '80mm 120mm';
    const title = selectedFormat === '40x20' 
      ? `Ticket-${ticket.ticketNumber}-Label` 
      : `Ticket-${ticket.ticketNumber}-Invoice`;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            @page {
              size: ${pageSize};
              margin: 0;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              width: ${selectedFormat === '40x20' ? '40mm' : '80mm'};
              height: ${selectedFormat === '40x20' ? '20mm' : '120mm'};
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
      printWindow.onafterprint = () => {
        printWindow.close();
        setIsDialogOpen(false);
        setSelectedFormat(null);
      };
    }, 250);
  };

  return (
    <>
      <Button onClick={() => setIsDialogOpen(true)} variant="outlined" size="sm">
        <PrinterIcon className="h-4 w-4 mr-2" />
        {t('print')}
      </Button>

      {/* Print Selection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setSelectedFormat(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('printTicket')}</DialogTitle>
            <DialogDescription>
              {t('selectFormat')} {ticket.ticketNumber}
            </DialogDescription>
          </DialogHeader>
          
          {!selectedFormat ? (
            <>
              <div className="space-y-3 py-4">
                <Button
                  onClick={() => handleSelectFormat('40x20')}
                  variant="outlined"
                  className="w-full justify-start h-auto py-4 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex flex-col items-start">
                    <div className="font-semibold text-base">{t('printLabel')}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {t('labelDescription')}
                    </div>
                  </div>
                </Button>
                <Button
                  onClick={() => handleSelectFormat('80x80')}
                  variant="outlined"
                  className="w-full justify-start h-auto py-4 hover:bg-gray-50 dark:hover:bg-gray-800"
                  disabled={!canPrintInvoice}
                  title={!canPrintInvoice ? 'Invoice can only be printed when ticket status is Completed or Repaired' : undefined}
                >
                  <div className="flex flex-col items-start">
                    <div className={`font-semibold text-base ${!canPrintInvoice ? 'opacity-50' : ''}`}>{t('printInvoice')}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {!canPrintInvoice 
                        ? 'Available only when status is Completed or Repaired'
                        : t('invoiceDescription')}
                    </div>
                  </div>
                </Button>
              </div>
              <DialogFooter>
                <Button variant="outlined" onClick={() => setIsDialogOpen(false)}>
                  {t('cancel')}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="py-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {selectedFormat === '40x20' ? t('labelPreview') : t('invoicePreview')}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {t('reviewPreview')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFormat(null)}
                  >
                    ← {t('back')}
                  </Button>
                </div>
                
                {/* Print Preview Container */}
                <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg overflow-auto flex justify-center items-center">
                  <div
                    ref={printRef}
                    className="bg-white shadow-lg border border-gray-300"
                    style={{
                      width: selectedFormat === '40x20' ? '151px' : '302px', // 40mm = 151px, 80mm = 302px (at 96 DPI)
                      height: selectedFormat === '40x20' ? '76px' : '453px', // 20mm = 76px, 120mm = 453px (at 96 DPI)
                      flexShrink: 0,
                      minWidth: selectedFormat === '40x20' ? '151px' : '302px',
                      minHeight: selectedFormat === '40x20' ? '76px' : '453px',
                    }}
                  >
                    {selectedFormat === '40x20' ? (
                      <TicketLabel40x20 ticket={ticket} />
                    ) : (
                      <TicketLabel80x80 ticket={ticket} />
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outlined" onClick={() => setSelectedFormat(null)}>
                  {t('back')}
                </Button>
                <Button onClick={handlePrint}>
                  <PrinterIcon className="h-4 w-4 mr-2" />
                  {t('print')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

