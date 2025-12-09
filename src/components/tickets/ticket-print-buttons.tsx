'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PrinterIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
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
  const printRef = useRef<HTMLDivElement>(null);

  const isArabic = printLanguage === 'ar';
  const effectivePrintLanguage = isArabic ? 'en' : printLanguage;

  const handleSelectFormat = (format: 'label' | 'receipt' | 'invoice') => {
    if (format === 'label' && isArabic) return;
    setSelectedFormat(format);
  };

  const handlePrint = async () => {
    try {
      if (selectedFormat) {
        const langToUse = selectedFormat === 'label' ? printLanguage : effectivePrintLanguage;
        await print(selectedFormat, langToUse as 'en' | 'fr');
        setIsDialogOpen(false);
        setSelectedFormat(null);
      }
    } catch (error) {
      console.error(error);
      toast({ title: t('error'), description: 'Failed to print', variant: 'destructive' });
    }
  };

  const formatColors: Record<string, string> = {
    label: 'from-blue-500 to-cyan-500',
    receipt: 'from-emerald-500 to-teal-500',
    invoice: 'from-violet-500 to-purple-500',
  };

  return (
    <>
      <Button
        onClick={() => setIsDialogOpen(true)}
        variant="outline"
        className="gap-2 px-4 py-2 h-10 text-sm font-medium border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
      >
        <span className="material-symbols-outlined text-xl">print</span>
        {t('print')}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setSelectedFormat(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <VisuallyHidden>
            <DialogTitle>Print Ticket</DialogTitle>
          </VisuallyHidden>
          {/* Big Header with Printer Icon */}
          <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-t-lg text-center border-b border-gray-200 dark:border-gray-700">
            <div className="w-20 h-20 mx-auto bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center mb-4 shadow-lg border border-blue-200 dark:border-blue-800">
              <span className="material-symbols-outlined text-5xl text-blue-600 dark:text-blue-400">print</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('printTicket')}</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {t('selectFormat')} <span className="font-semibold text-gray-900 dark:text-white">{ticket.ticketNumber}</span>
            </p>
          </div>

          <div className="p-6">
            {!selectedFormat ? (
              <>
                {/* Language Selection */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">{t('language')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { code: 'en', flag: '🇬🇧', label: 'English' },
                      { code: 'fr', flag: '🇫🇷', label: 'Français' },
                      { code: 'ar', flag: '🇸🇦', label: 'العربية' },
                    ].map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setPrintLanguage(lang.code as 'en' | 'fr' | 'ar')}
                        className={`px-4 py-3 rounded-xl border-2 transition-all font-medium flex items-center justify-center gap-2 ${printLanguage === lang.code
                          ? lang.code === 'ar'
                            ? 'border-amber-500 bg-amber-500 text-white shadow-lg scale-[1.02]'
                            : 'border-blue-600 bg-blue-600 text-white shadow-lg scale-[1.02]'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                          }`}
                      >
                        <span className="text-lg">{lang.flag}</span>
                        <span className="hidden sm:inline">{lang.label}</span>
                        {printLanguage === lang.code && <span className="material-symbols-outlined text-sm text-white">check_circle</span>}
                      </button>
                    ))}
                  </div>
                  {isArabic && (
                    <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                        <span className="material-symbols-outlined">info</span>
                        Arabic: Labels disabled. Receipt/Invoice use English layout.
                      </p>
                    </div>
                  )}
                </div>

                {/* Format Cards */}
                <div className="space-y-3">
                  {/* Label */}
                  <button
                    onClick={() => handleSelectFormat('label')}
                    disabled={isArabic}
                    className={`w-full p-4 rounded-xl border-2 transition-all group text-left flex items-center gap-4 ${isArabic ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50' : 'border-gray-200 hover:border-primary-400'
                      }`}
                  >
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${isArabic ? 'from-gray-400 to-gray-500' : formatColors.label} flex items-center justify-center shadow-lg ${!isArabic && 'group-hover:scale-110'} transition-transform`}>
                      <span className="material-symbols-outlined text-2xl text-white">label</span>
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold text-lg ${isArabic ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>{t('printLabel') || 'Print Label'}</h3>
                      <p className={`text-sm ${isArabic ? 'text-gray-400' : 'text-gray-500'}`}>40×20mm • QR code + device info{isArabic && ' (Disabled)'}</p>
                    </div>
                    {!isArabic && <span className="material-symbols-outlined text-gray-400 group-hover:text-primary-500">arrow_forward</span>}
                  </button>

                  {/* Receipt */}
                  <button onClick={() => handleSelectFormat('receipt')} className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-primary-400 transition-all group text-left flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${formatColors.receipt} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <span className="material-symbols-outlined text-2xl text-white">receipt_long</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{t('printReceipt') || 'Print Receipt'}</h3>
                      <p className="text-sm text-gray-500">80mm Thermal • Payment history{isArabic && <span className="text-amber-600"> (EN)</span>}</p>
                    </div>
                    <span className="material-symbols-outlined text-gray-400 group-hover:text-primary-500">arrow_forward</span>
                  </button>

                  {/* Invoice */}
                  <button onClick={() => handleSelectFormat('invoice')} className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-primary-400 transition-all group text-left flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${formatColors.invoice} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <span className="material-symbols-outlined text-2xl text-white">description</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{t('printInvoice') || 'Print Invoice'}</h3>
                      <p className="text-sm text-gray-500">A4 PDF • Full invoice{isArabic && <span className="text-amber-600"> (EN)</span>}</p>
                    </div>
                    <span className="material-symbols-outlined text-gray-400 group-hover:text-primary-500">arrow_forward</span>
                  </button>
                </div>

                <DialogFooter className="mt-6 pt-4 border-t">
                  <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>{t('cancel')}</Button>
                </DialogFooter>
              </>
            ) : (
              <>
                {/* Preview */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${formatColors[selectedFormat]} flex items-center justify-center`}>
                      <span className="material-symbols-outlined text-lg text-white">{selectedFormat === 'label' ? 'label' : selectedFormat === 'receipt' ? 'receipt_long' : 'description'}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white capitalize">{selectedFormat} Preview</h3>
                      <p className="text-xs text-gray-500">{effectivePrintLanguage === 'en' ? 'English' : 'Français'}{isArabic && ' (Arabic fallback)'}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedFormat(null)} className="gap-1">
                    <span className="material-symbols-outlined">arrow_back</span> {t('back')}
                  </Button>
                </div>

                <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-xl flex justify-center items-center min-h-[200px]">
                  {selectedFormat === 'invoice' ? (
                    <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-xl shadow-lg max-w-sm border border-gray-200 dark:border-gray-700">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center mb-4 shadow-md">
                        <span className="material-symbols-outlined text-3xl text-white">picture_as_pdf</span>
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-lg">PDF Invoice Ready</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Click below to generate and download your A4 invoice.</p>
                      <Button onClick={handlePrint} disabled={isGeneratingPdf} className="w-full gap-2" size="lg">
                        {isGeneratingPdf ? <><span className="material-symbols-outlined animate-spin">progress_activity</span>Generating...</> : <><ArrowDownTrayIcon className="h-5 w-5" />Download PDF</>}
                      </Button>
                    </div>
                  ) : (
                    <div ref={printRef} className="bg-white shadow-xl border rounded-lg overflow-hidden" style={{ width: selectedFormat === 'label' ? '151px' : '302px', minHeight: selectedFormat === 'label' ? '76px' : 'auto' }}>
                      {selectedFormat === 'label' && <TicketLabel40x20 ticket={ticket} />}
                      {selectedFormat === 'receipt' && <ReceiptTemplate ticket={ticket} language={effectivePrintLanguage} />}
                    </div>
                  )}
                </div>

                <DialogFooter className="mt-6 pt-4 border-t">
                  <Button variant="ghost" onClick={() => setSelectedFormat(null)}>{t('back')}</Button>
                  {selectedFormat !== 'invoice' && <Button onClick={handlePrint} disabled={isGeneratingPdf} className="gap-2"><PrinterIcon className="h-4 w-4" />{t('print')}</Button>}
                </DialogFooter>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
