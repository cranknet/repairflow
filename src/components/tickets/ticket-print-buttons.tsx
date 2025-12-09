'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PrinterIcon, ArrowDownTrayIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TicketLabel40x20 } from './ticket-label-40x20';
import { ReceiptTemplate } from './receipt-template';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/components/ui/use-toast';
import { useTicketPrint } from './ticket-print-context';

export function TicketPrintButtons({ ticket }: { ticket: any }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { print, isGeneratingPdf } = useTicketPrint();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'label' | 'receipt' | 'invoice' | null>(null);
  const [printLanguage, setPrintLanguage] = useState<'en' | 'fr' | 'ar'>('en');
  // const [isGeneratingPdf, setIsGeneratingPdf] = useState(false); // Removed local state logic
  const printRef = useRef<HTMLDivElement>(null);

  // Check if invoice can be printed (only for REPAIRED status, or if ticket has returns)
  // Implementation Note: User requested full payment history, so receipt/invoice might be useful even before completion
  // But keeping restriction for Invoice PDF to avoid incomplete invoices.
  const hasReturns = ticket.returns && ticket.returns.length > 0;
  const canPrintInvoice = true; // Enabled for all statuses to allow pro-forma or receipts

  const handleSelectFormat = (format: 'label' | 'receipt' | 'invoice') => {
    setSelectedFormat(format);
  };

  const handlePrint = async () => {
    try {
      if (selectedFormat) {
        await print(selectedFormat, printLanguage);
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <Button onClick={() => setIsDialogOpen(true)} variant="outline" size="sm">
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
            <DialogTitle className="flex justify-between items-center">
              <span>{t('printTicket')}</span>
              <div className="flex items-center gap-2">
                <GlobeAltIcon className="h-4 w-4 text-gray-500" />
                <Select value={printLanguage} onValueChange={(v: any) => setPrintLanguage(v)}>
                  <SelectTrigger className="w-[100px] h-8">
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </DialogTitle>
            <DialogDescription>
              {t('selectFormat')} {ticket.ticketNumber}
            </DialogDescription>
          </DialogHeader>

          {!selectedFormat ? (
            <>
              <div className="space-y-3 py-4">
                {/* 1. Label */}
                <Button
                  onClick={() => handleSelectFormat('label')}
                  variant="outline"
                  className="w-full justify-start h-auto py-4 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex flex-col items-start text-left">
                    <div className="font-semibold text-base">{t('printLabel') || 'Print Label (40x20mm)'}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {t('labelDescription') || 'Compact label with QR code for device tracking'}
                    </div>
                  </div>
                </Button>

                {/* 2. Receipt */}
                <Button
                  onClick={() => handleSelectFormat('receipt')}
                  variant="outline"
                  className="w-full justify-start h-auto py-4 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex flex-col items-start text-left">
                    <div className="font-semibold text-base">{t('printReceipt') || 'Print Receipt (Thermal)'}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {t('receiptDescription') || 'Thermal printer receipt with payment history'}
                    </div>
                  </div>
                </Button>

                {/* 3. Invoice PDF */}
                <Button
                  onClick={() => handleSelectFormat('invoice')}
                  variant="outline"
                  className="w-full justify-start h-auto py-4 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex flex-col items-start text-left">
                    <div className="font-semibold text-base">{t('printInvoice') || 'Print Invoice (A4 PDF)'}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {t('invoiceDescription') || 'Full A4 invoice for standard printers'}
                    </div>
                  </div>
                </Button>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t('cancel')}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="py-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg capitalize">
                      {selectedFormat} Preview
                    </h3>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedFormat(null)}>
                    ← {t('back')}
                  </Button>
                </div>

                {/* Print Preview Container */}
                <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg overflow-auto flex justify-center items-center">

                  {selectedFormat === 'invoice' ? (
                    <div className="text-center p-10 bg-white rounded shadow">
                      <p className="mb-4 text-gray-600">PDF Preview not available inline.</p>
                      <Button onClick={handlePrint} disabled={isGeneratingPdf}>
                        {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
                      </Button>
                    </div>
                  ) : (
                    <div
                      ref={printRef}
                      className="bg-white shadow-lg border border-gray-300 origin-top transform scale-100" // prevent scale issues
                      style={{
                        width: selectedFormat === 'label' ? '151px' : '302px', // 40mm~151px, 80mm~302px
                        minHeight: selectedFormat === 'label' ? '76px' : 'auto',
                        padding: 0,
                      }}
                    >
                      {selectedFormat === 'label' && <TicketLabel40x20 ticket={ticket} />}
                      {selectedFormat === 'receipt' && <ReceiptTemplate ticket={ticket} language={printLanguage} />}
                    </div>
                  )}

                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedFormat(null)}>
                  {t('back')}
                </Button>
                <Button onClick={handlePrint} disabled={isGeneratingPdf}>
                  {selectedFormat === 'invoice' ? (
                    <>
                      <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                      {isGeneratingPdf ? 'Generating...' : t('download')}
                    </>
                  ) : (
                    <>
                      <PrinterIcon className="h-4 w-4 mr-2" />
                      {t('print')}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

