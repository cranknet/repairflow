'use client';

import { format } from 'date-fns';
import { useMemo, useState, useRef } from 'react';
import {
  ArrowLeftIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  TagIcon,
  ReceiptRefundIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  ArrowLeftIcon as BackIcon,
  DocumentIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';
import { formatId } from '@/lib/utils';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { TicketLabel40x20 } from './ticket-label-40x20';
import { ReceiptTemplate } from './receipt-template';
import { useToast } from '@/components/ui/use-toast';

interface TicketDetailHeaderProps {
  ticketNumber: string;
  createdAt: Date | string;
  ticket: any;
}

export function TicketDetailHeader({ ticketNumber, createdAt, ticket }: TicketDetailHeaderProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'label' | 'receipt' | 'invoice' | null>(null);
  const [printLanguage, setPrintLanguage] = useState<'en' | 'fr' | 'ar'>('en');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const isArabic = printLanguage === 'ar';

  const formattedDate = useMemo(() => {
    return format(new Date(createdAt), 'MMM dd, yyyy HH:mm');
  }, [createdAt]);

  const handleSelectFormat = (format: 'label' | 'receipt' | 'invoice') => {
    if (format === 'label' && isArabic) return;
    setSelectedFormat(format);
  };

  const handlePrint = async () => {
    if (!selectedFormat) return;

    if (selectedFormat === 'invoice') {
      // PDF generation - use English for Arabic since server-side Arabic font has issues
      const pdfLanguage = printLanguage === 'ar' ? 'en' : printLanguage;
      setIsGeneratingPdf(true);
      try {
        const response = await fetch('/api/print', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId: ticket.id, format: 'invoice', language: pdfLanguage }),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('PDF API Error:', errorData);
          throw new Error(errorData.details || 'Failed to generate PDF');
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice-${ticket.ticketNumber}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        setIsDialogOpen(false);
        setSelectedFormat(null);
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Failed to generate PDF';
        console.error('PDF generation error:', errMsg);
        toast({ title: 'Error', description: errMsg, variant: 'destructive' });
      } finally {
        setIsGeneratingPdf(false);
      }
    } else {
      // Client-side print
      if (!printRef.current) return;
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      const content = printRef.current.innerHTML;
      const width = selectedFormat === 'label' ? '40mm' : '80mm';
      printWindow.document.write(`<!DOCTYPE html><html><head><title>Print</title><style>@page{size:${width} auto;margin:0}body{margin:0;padding:0}*{box-sizing:border-box}</style></head><body>${content}</body></html>`);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
      setIsDialogOpen(false);
      setSelectedFormat(null);
    }
  };

  const formatColors: Record<string, string> = {
    label: 'from-blue-500 to-cyan-500',
    receipt: 'from-emerald-500 to-teal-500',
    invoice: 'from-red-500 to-rose-600',
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        {/* Left side - Back button and ticket info */}
        <div className="flex items-center gap-4">
          <Link href="/tickets">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              {formatId(ticketNumber)}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('createdAt')} {formattedDate}
            </p>
          </div>
        </div>

        {/* Right side - Print Button */}
        <Button
          onClick={() => setIsDialogOpen(true)}
          variant="outline"
          className="gap-2 px-4 py-2 h-10 text-sm font-medium border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
        >
          <PrinterIcon className="h-5 w-5" />
          <span className="hidden sm:inline">{t('print')}</span>
        </Button>
      </div>

      {/* Print Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setSelectedFormat(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <VisuallyHidden><DialogTitle>Print Ticket</DialogTitle></VisuallyHidden>

          {/* Header */}
          <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-t-lg text-center border-b border-gray-200 dark:border-gray-700">
            <div className="w-20 h-20 mx-auto bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center mb-4 shadow-lg border border-blue-200 dark:border-blue-800">
              <PrinterIcon className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('printTicket')}</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">{t('selectFormat')} <span className="font-semibold text-gray-900 dark:text-white">{ticket.ticketNumber}</span></p>
          </div>

          <div className="p-6">
            {!selectedFormat ? (
              <>
                {/* Language */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">{t('language')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ code: 'en', flag: '🇬🇧', label: 'English' }, { code: 'fr', flag: '🇫🇷', label: 'Français' }, { code: 'ar', flag: '🇸🇦', label: 'العربية' }].map((lang) => (
                      <button key={lang.code} onClick={() => setPrintLanguage(lang.code as any)}
                        className={`px-4 py-3 rounded-xl border-2 transition-all font-medium flex items-center justify-center gap-2 ${printLanguage === lang.code ? (lang.code === 'ar' ? 'border-amber-500 bg-amber-500 text-white shadow-lg' : 'border-blue-600 bg-blue-600 text-white shadow-lg') : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}`}>
                        <span className="text-lg">{lang.flag}</span>
                        <span className="hidden sm:inline">{lang.label}</span>
                        {printLanguage === lang.code && <CheckCircleIcon className="h-4 w-4 text-white" />}
                      </button>
                    ))}
                  </div>
                  {isArabic && <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"><p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2"><InformationCircleIcon className="h-5 w-5" />Arabic: Labels disabled. Invoice uses English.</p></div>}
                </div>

                {/* Formats */}
                <div className="space-y-3">
                  <button onClick={() => handleSelectFormat('label')} disabled={isArabic} className={`w-full p-4 rounded-xl border-2 transition-all group text-left flex items-center gap-4 ${isArabic ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50' : 'border-gray-200 hover:border-blue-400'}`}>
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${isArabic ? 'from-gray-400 to-gray-500' : formatColors.label} flex items-center justify-center shadow-lg`}><TagIcon className="h-6 w-6 text-white" /></div>
                    <div className="flex-1"><h3 className={`font-semibold text-lg ${isArabic ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>{t('printLabel') || 'Print Label'}</h3><p className={`text-sm ${isArabic ? 'text-gray-400' : 'text-gray-500'}`}>40×20mm • QR code</p></div>
                    {!isArabic && <ArrowRightIcon className="h-5 w-5 text-gray-400" />}
                  </button>
                  <button onClick={() => handleSelectFormat('receipt')} className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-emerald-400 transition-all group text-left flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${formatColors.receipt} flex items-center justify-center shadow-lg`}><ReceiptRefundIcon className="h-6 w-6 text-white" /></div>
                    <div className="flex-1"><h3 className="font-semibold text-gray-900 dark:text-white text-lg">{t('printReceipt') || 'Print Receipt'}</h3><p className="text-sm text-gray-500">80mm Thermal</p></div>
                    <ArrowRightIcon className="h-5 w-5 text-gray-400" />
                  </button>
                  <button onClick={() => handleSelectFormat('invoice')} className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-red-400 transition-all group text-left flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${formatColors.invoice} flex items-center justify-center shadow-lg`}><DocumentTextIcon className="h-6 w-6 text-white" /></div>
                    <div className="flex-1"><h3 className="font-semibold text-gray-900 dark:text-white text-lg">{t('printInvoice') || 'Print Invoice'}</h3><p className="text-sm text-gray-500">A4 PDF</p></div>
                    <ArrowRightIcon className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${formatColors[selectedFormat]} flex items-center justify-center`}>{selectedFormat === 'label' ? <TagIcon className="h-[18px] w-[18px] text-white" /> : selectedFormat === 'receipt' ? <ReceiptRefundIcon className="h-[18px] w-[18px] text-white" /> : <DocumentTextIcon className="h-[18px] w-[18px] text-white" />}</div>
                    <div><h3 className="font-semibold text-gray-900 dark:text-white capitalize">{selectedFormat} Preview</h3><p className="text-xs text-gray-500">{printLanguage === 'en' ? 'English' : printLanguage === 'fr' ? 'Français' : 'العربية'}</p></div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedFormat(null)}><ArrowLeftIcon className="h-4 w-4 mr-1" /> {t('back')}</Button>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-xl flex justify-center items-center min-h-[200px]">
                  {selectedFormat === 'invoice' ? (
                    <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-xl shadow-lg max-w-sm border border-gray-200 dark:border-gray-700">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center mb-4"><DocumentIcon className="h-8 w-8 text-white" /></div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-lg">PDF Invoice Ready</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Click to download A4 invoice.</p>
                      <Button onClick={handlePrint} disabled={isGeneratingPdf} className="w-full gap-2" size="lg">{isGeneratingPdf ? <><ArrowPathIcon className="h-5 w-5 animate-spin" />Generating...</> : <><ArrowDownTrayIcon className="h-5 w-5" />Download PDF</>}</Button>
                    </div>
                  ) : (
                    <div ref={printRef} className="bg-white shadow-xl border rounded-lg overflow-hidden" style={{ width: selectedFormat === 'label' ? '151px' : '302px', minHeight: selectedFormat === 'label' ? '76px' : 'auto' }}>
                      {selectedFormat === 'label' && <TicketLabel40x20 ticket={ticket} />}
                      {selectedFormat === 'receipt' && <ReceiptTemplate ticket={ticket} language={printLanguage} />}
                    </div>
                  )}
                </div>
                <DialogFooter className="mt-6 pt-4 border-t">
                  <Button variant="ghost" onClick={() => setSelectedFormat(null)}>{t('back')}</Button>
                  {selectedFormat !== 'invoice' && <Button onClick={handlePrint} className="gap-2"><PrinterIcon className="h-4 w-4" />{t('print')}</Button>}
                </DialogFooter>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
