export interface InvoicePDFProps {
    ticket: any; // Ideally this should be a proper Ticket type from Prisma/types
    settings: any;
    language: 'en' | 'fr' | 'ar';
}

export interface PDFTotals {
    subtotal: number;
    totalPaid: number;
    finalTotal: number;
    balanceDue: number;
}

export interface PDFComponentProps {
    ticket: any;
    settings?: any;
    t: any;
    isRTL: boolean;
    totals?: PDFTotals;
}
