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

export function TicketPrintButtons({ ticket }: { ticket: any }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'40x20' | '80x80' | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handleSelectFormat = (format: '40x20' | '80x80') => {
    setSelectedFormat(format);
  };

  const handlePrint = () => {
    if (!printRef.current) return;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = printRef.current.innerHTML;
    const pageSize = selectedFormat === '40x20' ? '40mm 20mm' : '80mm 80mm';
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
              height: ${selectedFormat === '40x20' ? '20mm' : '80mm'};
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
      <Button onClick={() => setIsDialogOpen(true)} variant="outline" size="sm">
        <PrinterIcon className="h-4 w-4 mr-2" />
        Print
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
            <DialogTitle>Print Ticket</DialogTitle>
            <DialogDescription>
              Select format and preview for ticket {ticket.ticketNumber}
            </DialogDescription>
          </DialogHeader>
          
          {!selectedFormat ? (
            <>
              <div className="space-y-3 py-4">
                <Button
                  onClick={() => handleSelectFormat('40x20')}
                  variant="outline"
                  className="w-full justify-start h-auto py-4 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex flex-col items-start">
                    <div className="font-semibold text-base">Print Label (40x20mm)</div>
                    <div className="text-sm text-gray-500 mt-1">
                      Small label with ticket number, customer, device, and QR code
                    </div>
                  </div>
                </Button>
                <Button
                  onClick={() => handleSelectFormat('80x80')}
                  variant="outline"
                  className="w-full justify-start h-auto py-4 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex flex-col items-start">
                    <div className="font-semibold text-base">Print Invoice (80x80mm)</div>
                    <div className="text-sm text-gray-500 mt-1">
                      Full invoice with customer details, device info, pricing, and QR code
                    </div>
                  </div>
                </Button>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="py-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {selectedFormat === '40x20' ? 'Label Preview (40x20mm)' : 'Invoice Preview (80x80mm)'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Review the preview before printing
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFormat(null)}
                  >
                    ← Back
                  </Button>
                </div>
                
                {/* Print Preview Container */}
                <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg overflow-auto flex justify-center items-center">
                  <div
                    ref={printRef}
                    className="bg-white shadow-lg border border-gray-300"
                    style={{
                      width: selectedFormat === '40x20' ? '151px' : '302px', // 40mm = 151px, 80mm = 302px (at 96 DPI)
                      height: selectedFormat === '40x20' ? '76px' : '302px', // 20mm = 76px, 80mm = 302px
                      flexShrink: 0,
                      minWidth: selectedFormat === '40x20' ? '151px' : '302px',
                      minHeight: selectedFormat === '40x20' ? '76px' : '302px',
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
                <Button variant="outline" onClick={() => setSelectedFormat(null)}>
                  Back
                </Button>
                <Button onClick={handlePrint}>
                  <PrinterIcon className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

