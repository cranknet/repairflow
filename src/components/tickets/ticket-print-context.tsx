'use client';

import React, { createContext, useContext, useRef, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { TicketLabel40x20 } from './ticket-label-40x20';
import { ReceiptTemplate } from './receipt-template';

type PrintFormat = 'label' | 'receipt' | 'invoice';

interface TicketPrintContextType {
    print: (format: PrintFormat, language: 'en' | 'fr' | 'ar') => Promise<void>;
    autoPrint: () => Promise<void>;
    isGeneratingPdf: boolean;
}

const TicketPrintContext = createContext<TicketPrintContextType | undefined>(undefined);

export function useTicketPrint() {
    const context = useContext(TicketPrintContext);
    if (!context) {
        throw new Error('useTicketPrint must be used within a TicketPrintProvider');
    }
    return context;
}

interface TicketPrintProviderProps {
    children: ReactNode;
    ticket: any;
}

export function TicketPrintProvider({ children, ticket }: TicketPrintProviderProps) {
    const { toast } = useToast();
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    // State for rendering hidden content
    const [renderFormat, setRenderFormat] = useState<PrintFormat | null>(null);
    const [renderLanguage, setRenderLanguage] = useState<'en' | 'fr' | 'ar'>('en');

    // Fetch settings on mount
    const [settings, setSettings] = useState<Record<string, string>>({});
    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                const settingsMap = data.reduce((acc: any, curr: any) => ({ ...acc, [curr.key]: curr.value }), {});
                setSettings(settingsMap);
            })
            .catch(console.error);
    }, []);

    const print = async (format: PrintFormat, language: 'en' | 'fr' | 'ar') => {
        if (format === 'invoice') {
            await handlePdfPrint(language);
        } else {
            await handleClientPrint(format, language);
        }
    };

    const autoPrint = async () => {
        if (settings['receipt_auto_print'] !== 'true') return;

        // Determine format from settings or default to receipt
        // logic: if user explicitly sets "Invoice Size" to "Thermal", assume Receipt format
        // if A4, assume Invoice PDF format
        const invoiceSize = settings['print_invoice_size'] || '80x120';
        const lang = (settings['default_print_language'] as 'en' | 'fr' | 'ar') || 'en';

        if (invoiceSize === '80x120') {
            // Auto print thermal receipt
            await print('receipt', lang);
        } else {
            // Auto print PDF invoice
            await print('invoice', lang);
        }
    };

    const handlePdfPrint = async (language: string) => {
        setIsGeneratingPdf(true);
        try {
            const response = await fetch('/api/print', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticketId: ticket.id,
                    format: 'invoice',
                    language: language
                })
            });

            if (!response.ok) throw new Error('Failed to generate PDF');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Invoice-${ticket.ticketNumber}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast({ title: 'Success', description: 'Invoice downloaded successfully' });

        } catch (error) {
            console.error(error);
            toast({
                title: 'Error',
                description: 'Failed to generate invoice PDF',
                variant: 'destructive',
            });
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const handleClientPrint = (format: 'label' | 'receipt', language: 'en' | 'fr' | 'ar') => {
        return new Promise<void>((resolve) => {
            // Set state to render the content
            setRenderFormat(format);
            setRenderLanguage(language);

            // Wait for render
            setTimeout(() => {
                if (!printRef.current) {
                    setRenderFormat(null);
                    resolve();
                    return;
                }

                const printWindow = window.open('', '_blank');
                if (!printWindow) {
                    setRenderFormat(null);
                    resolve();
                    return;
                }

                const content = printRef.current.innerHTML;

                let pageSize = 'auto';
                let width = 'auto';
                let height = 'auto';

                if (format === 'label') {
                    pageSize = '40mm 20mm';
                    width = '40mm';
                    height = '20mm';
                } else if (format === 'receipt') {
                    pageSize = '80mm auto';
                    width = '80mm';
                    height = 'auto';
                }

                const isRTL = language === 'ar';

                const printContent = `
            <!DOCTYPE html>
            <html dir="${isRTL ? 'rtl' : 'ltr'}">
                <head>
                <title>Ticket-${ticket.ticketNumber}-${format}</title>
                <style>
                    @page {
                    size: ${pageSize};
                    margin: 0;
                    }
                    body {
                    margin: 0;
                    padding: 0;
                    font-family: Arial, sans-serif;
                    width: ${width};
                    height: ${height};
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
                        setRenderFormat(null); // Clear render
                        resolve();
                    };
                }, 500);

            }, 100); // Wait for React to render
        });
    };

    return (
        <TicketPrintContext.Provider value={{ print, autoPrint, isGeneratingPdf }}>
            {children}
            {/* Hidden Render Area */}
            <div style={{ display: 'none' }}>
                {renderFormat && (
                    <div ref={printRef}>
                        {renderFormat === 'label' && <TicketLabel40x20 ticket={ticket} />}
                        {renderFormat === 'receipt' && <ReceiptTemplate ticket={ticket} language={renderLanguage} />}
                    </div>
                )}
            </div>
        </TicketPrintContext.Provider>
    );
}
