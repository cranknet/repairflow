import React from 'react';
import { Document, Page, Font } from '@react-pdf/renderer';
import { styles } from './pdf/styles';
import { translations } from './pdf/translations';
import { InvoicePDFProps, PDFTotals } from './pdf/types';

// Components
import { PDFHeader } from './pdf/components/PDFHeader';
import { CustomerDeviceSection } from './pdf/components/CustomerDeviceSection';
import { ItemsTable } from './pdf/components/ItemsTable';
import { TotalsSection } from './pdf/components/TotalsSection';
import { PaymentHistory } from './pdf/components/PaymentHistory';
import { PDFFooter } from './pdf/components/PDFFooter';

// Register Arabic font using Google Fonts TTF URLs (direct links)
Font.register({
    family: 'Amiri',
    fonts: [
        {
            src: 'https://raw.githubusercontent.com/google/fonts/main/ofl/amiri/Amiri-Regular.ttf',
            fontWeight: 400,
            fontStyle: 'normal'
        },
        {
            src: 'https://raw.githubusercontent.com/google/fonts/main/ofl/amiri/Amiri-Italic.ttf',
            fontWeight: 400,
            fontStyle: 'italic'
        },
        {
            src: 'https://raw.githubusercontent.com/google/fonts/main/ofl/amiri/Amiri-Bold.ttf',
            fontWeight: 700,
            fontStyle: 'normal'
        },
        {
            src: 'https://raw.githubusercontent.com/google/fonts/main/ofl/amiri/Amiri-BoldItalic.ttf',
            fontWeight: 700,
            fontStyle: 'italic'
        },
    ],
});

// Hyphenation callback - needed for Arabic
Font.registerHyphenationCallback(word => [word]);

export const InvoicePDF = ({ ticket, settings, language }: InvoicePDFProps) => {
    const t = translations[language] || translations.en;
    const isRTL = language === 'ar';

    // Calculate totals
    const subtotal = ticket.parts?.reduce((acc: number, item: any) => acc + (item.part.unitPrice * item.quantity), 0) || 0;
    const totalPaid = ticket.payments?.reduce((acc: number, p: any) => acc + (p.amount || 0), 0) || 0;
    const finalTotal = ticket.finalPrice ?? ticket.estimatedPrice ?? 0;
    const balanceDue = finalTotal - totalPaid;

    const totals: PDFTotals = {
        subtotal,
        totalPaid,
        finalTotal,
        balanceDue
    };

    const fontStyle = isRTL ? { fontFamily: 'Amiri' } : {};

    const props = {
        ticket,
        settings,
        t,
        isRTL,
        totals
    };

    return (
        <Document>
            <Page size="A4" style={[styles.page, fontStyle]}>
                <PDFHeader {...props} />
                <CustomerDeviceSection {...props} />
                <ItemsTable {...props} />
                <TotalsSection {...props} />
                <PaymentHistory {...props} />
                <PDFFooter {...props} />
            </Page>
        </Document>
    );
};
