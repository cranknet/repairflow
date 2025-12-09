import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Register a font that supports Arabic (using a publicly available Google Font or local if available)
// For now, we'll try to use a standard font, but in production, you should bundle 'Amiri' or 'Cairo'
Font.register({
    family: 'Amiri',
    src: 'https://fonts.gstatic.com/s/amiri/v22/J7aRnpd8CGxBHpUrtLMg7Q.ttf'
});

// Styles
const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: 'Helvetica', // Default, will switch to Amiri for Arabic
        fontSize: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
    },
    logoSection: {
        width: '40%',
    },
    companyInfo: {
        fontSize: 9,
        color: '#666',
        marginTop: 5,
    },
    invoiceTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 5,
        textTransform: 'uppercase',
        color: '#333',
    },
    invoiceMeta: {
        fontSize: 9,
        textAlign: 'right',
    },
    twoCol: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    section: {
        width: '48%',
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 5,
        backgroundColor: '#f6f6f6',
        padding: 5,
        color: '#333',
    },
    row: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingVertical: 4,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f6f6f6',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        paddingVertical: 5,
        fontWeight: 'bold',
    },
    colDesc: { width: '50%', paddingLeft: 5 },
    colQty: { width: '15%', textAlign: 'center' },
    colPrice: { width: '20%', textAlign: 'right' },
    colTotal: { width: '15%', textAlign: 'right', paddingRight: 5 },

    // Payment Table
    colDate: { width: '25%', paddingLeft: 5 },
    colMethod: { width: '25%' },
    colRef: { width: '25%' },
    colAmount: { width: '25%', textAlign: 'right', paddingRight: 5 },

    totalSection: {
        marginTop: 10,
        alignItems: 'flex-end',
    },
    totalRow: {
        flexDirection: 'row',
        marginBottom: 3,
    },
    totalLabel: {
        width: 100,
        textAlign: 'right',
        paddingRight: 10,
        fontWeight: 'bold',
    },
    totalValue: {
        width: 80,
        textAlign: 'right',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 8,
        color: '#888',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 10,
    },
    terms: {
        marginTop: 20,
        fontSize: 8,
        color: '#666',
        fontStyle: 'italic',
    }
});

interface InvoicePDFProps {
    ticket: any;
    settings: any;
    language: 'en' | 'fr' | 'ar';
}

const translations = {
    en: {
        invoice: 'INVOICE',
        date: 'Date',
        ticketNo: 'Ticket #',
        billTo: 'Bill To',
        device: 'Device',
        issue: 'Issue',
        description: 'Description',
        qty: 'Qty',
        price: 'Price',
        total: 'Total',
        subtotal: 'Subtotal',
        paid: 'Paid',
        balance: 'Balance Due',
        paymentHistory: 'Payment History',
        paymentDate: 'Date',
        method: 'Method',
        reference: 'Ref',
        amount: 'Amount',
        thankYou: 'Thank you for your business!',
        noPayments: 'No payments recorded.',
        paymentStatus: {
            PAID: 'PAID',
            UNPAID: 'UNPAID',
            PARTIAL: 'PARTIAL'
        }
    },
    fr: {
        invoice: 'FACTURE',
        date: 'Date',
        ticketNo: 'Ticket N°',
        billTo: 'Facturé à',
        device: 'Appareil',
        issue: 'Problème',
        description: 'Description',
        qty: 'Qté',
        price: 'Prix',
        total: 'Total',
        subtotal: 'Sous-total',
        paid: 'Payé',
        balance: 'Reste à payer',
        paymentHistory: 'Historique des paiements',
        paymentDate: 'Date',
        method: 'Méthode',
        reference: 'Réf',
        amount: 'Montant',
        thankYou: 'Merci de votre confiance !',
        noPayments: 'Aucun paiement enregistré.',
        paymentStatus: {
            PAID: 'PAYÉ',
            UNPAID: 'IMPAYÉ',
            PARTIAL: 'PARTIEL'
        }
    },
    ar: {
        invoice: 'فاتورة',
        date: 'التاريخ',
        ticketNo: 'رقم التذكرة',
        billTo: 'فاتورة إلى',
        device: 'الجهاز',
        issue: 'المشكلة',
        description: 'الوصف',
        qty: 'الكمية',
        price: 'السعر',
        total: 'المجموع',
        subtotal: 'المجموع الفرعي',
        paid: 'المدفوع',
        balance: 'المتبقي',
        paymentHistory: 'سجل الدفعات',
        paymentDate: 'التاريخ',
        method: 'الطريقة',
        reference: 'مرجع',
        amount: 'المبلغ',
        thankYou: 'شكراً لتعاملكم معنا!',
        noPayments: 'لا توجد دفعات مسجلة.',
        paymentStatus: {
            PAID: 'مدفوع',
            UNPAID: 'غير مدفوع',
            PARTIAL: 'دفعة جزئية'
        }
    }
};

export const InvoicePDF = ({ ticket, settings, language }: InvoicePDFProps) => {
    const t = translations[language] || translations.en;
    const isRTL = language === 'ar';

    // Calculate totals
    const subtotal = ticket.parts?.reduce((acc: number, item: any) => acc + (item.part.unitPrice * item.quantity), 0) || 0;
    // This is a simplification; ideally use ticket.finalPrice if set, or calculate properly
    // Assuming estimatedPrice vs finalPrice logic exists in ticket

    // Calculate payments
    const totalPaid = ticket.payments?.reduce((acc: number, p: any) => acc + (p.amount || 0), 0) || 0;
    const finalTotal = ticket.finalPrice ?? ticket.estimatedPrice ?? 0;
    const balanceDue = finalTotal - totalPaid;

    const fontStyle = isRTL ? { fontFamily: 'Amiri' } : {};
    const textAlign = isRTL ? 'right' : 'left';
    const flexDirection = isRTL ? 'row-reverse' : 'row';

    return (
        <Document>
            <Page size="A4" style={[styles.page, fontStyle]}>

                {/* Header */}
                <View style={[styles.header, { flexDirection: flexDirection }]}>
                    <View style={styles.logoSection}>
                        <Text style={styles.invoiceTitle}>{t.invoice}</Text>
                        <Text style={styles.companyInfo}>{settings.company_name || 'RepairFlow'}</Text>
                        <Text style={styles.companyInfo}>{settings.company_address || ''}</Text>
                        <Text style={styles.companyInfo}>{settings.company_phone || ''}</Text>
                        <Text style={styles.companyInfo}>{settings.company_email || ''}</Text>
                    </View>
                    <View style={styles.invoiceMeta}>
                        <Text>{t.ticketNo}: {ticket.ticketNumber}</Text>
                        <Text>{t.date}: {format(new Date(ticket.createdAt), 'yyyy-MM-dd')}</Text>
                        <Text style={{ marginTop: 5, fontWeight: 'bold', color: balanceDue <= 0.01 ? 'green' : 'red' }}>
                            {balanceDue <= 0.01 ? t.paymentStatus.PAID : (totalPaid > 0 ? t.paymentStatus.PARTIAL : t.paymentStatus.UNPAID)}
                        </Text>
                    </View>
                </View>

                {/* Customer & Device Details */}
                <View style={[styles.twoCol, { flexDirection: flexDirection }]}>
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { textAlign }]}>{t.billTo}</Text>
                        <Text style={{ textAlign }}>{ticket.customer?.name}</Text>
                        <Text style={{ textAlign }}>{ticket.customer?.phone}</Text>
                        <Text style={{ textAlign }}>{ticket.customer?.email}</Text>
                        <Text style={{ textAlign }}>{ticket.customer?.address}</Text>
                    </View>
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { textAlign }]}>{t.device}</Text>
                        <Text style={{ textAlign }}>{ticket.deviceBrand} {ticket.deviceModel}</Text>
                        <Text style={{ textAlign, fontSize: 9, color: '#666' }}>{t.issue}: {ticket.deviceIssue}</Text>
                    </View>
                </View>

                {/* Parts / Service Items Table */}
                <View style={{ marginTop: 20 }}>
                    <View style={[styles.tableHeader, { flexDirection: flexDirection }]}>
                        <Text style={[styles.colDesc, { textAlign }]}>{t.description}</Text>
                        <Text style={styles.colQty}>{t.qty}</Text>
                        <Text style={styles.colPrice}>{t.price}</Text>
                        <Text style={styles.colTotal}>{t.total}</Text>
                    </View>

                    {/* Render Parts */}
                    {ticket.parts?.map((item: any, i: number) => (
                        <View key={i} style={[styles.row, { flexDirection: flexDirection }]}>
                            <Text style={[styles.colDesc, { textAlign }]}>{item.part.name}</Text>
                            <Text style={styles.colQty}>{item.quantity}</Text>
                            <Text style={styles.colPrice}>$ {item.part.unitPrice.toFixed(2)}</Text>
                            <Text style={styles.colTotal}>$ {(item.quantity * item.part.unitPrice).toFixed(2)}</Text>
                        </View>
                    ))}

                    {/* Render Labor/Custom Items if they were part of the schema (assuming covered by PriceAdjustments or similar) */}
                    {/* For now, just showing final calculations */}
                </View>

                {/* Totals */}
                <View style={styles.totalSection}>
                    {/* If there's a difference between sum of parts and final price, show as "Labor/Service" */}
                    {(finalTotal - subtotal) > 0.01 && (
                        <View style={[styles.totalRow, { flexDirection: flexDirection }]}>
                            <Text style={styles.totalLabel}>Labor/Service:</Text>
                            <Text style={styles.totalValue}>$ {(finalTotal - subtotal).toFixed(2)}</Text>
                        </View>
                    )}

                    <View style={[styles.totalRow, { flexDirection: flexDirection }]}>
                        <Text style={styles.totalLabel}>{t.total}:</Text>
                        <Text style={styles.totalValue}>$ {finalTotal.toFixed(2)}</Text>
                    </View>
                    <View style={[styles.totalRow, { flexDirection: flexDirection }]}>
                        <Text style={styles.totalLabel}>{t.paid}:</Text>
                        <Text style={styles.totalValue}>$ {totalPaid.toFixed(2)}</Text>
                    </View>
                    <View style={[styles.totalRow, { flexDirection: flexDirection, borderTopWidth: 1, borderTopColor: '#000', paddingTop: 5 }]}>
                        <Text style={[styles.totalLabel, { fontSize: 12 }]}>{t.balance}:</Text>
                        <Text style={[styles.totalValue, { fontSize: 12, fontWeight: 'bold' }]}>$ {balanceDue.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Payment History Table - NEW */}
                <View style={{ marginTop: 30 }} break={false}>
                    <Text style={[styles.sectionTitle, { textAlign }]}>{t.paymentHistory}</Text>
                    <View style={[styles.tableHeader, { flexDirection: flexDirection, marginTop: 5 }]}>
                        <Text style={[styles.colDate, { textAlign }]}>{t.paymentDate}</Text>
                        <Text style={[styles.colMethod, { textAlign }]}>{t.method}</Text>
                        <Text style={[styles.colRef, { textAlign }]}>{t.reference}</Text>
                        <Text style={[styles.colAmount, { textAlign }]}>{t.amount}</Text>
                    </View>

                    {ticket.payments && ticket.payments.length > 0 ? (
                        ticket.payments.map((payment: any, i: number) => (
                            <View key={`pay-${i}`} style={[styles.row, { flexDirection: flexDirection }]}>
                                <Text style={[styles.colDate, { textAlign }]}>{format(new Date(payment.createdAt), 'yyyy-MM-dd')}</Text>
                                <Text style={[styles.colMethod, { textAlign }]}>{payment.method}</Text>
                                <Text style={[styles.colRef, { textAlign }]}>{payment.reference || '-'}</Text>
                                <Text style={[styles.colAmount, { textAlign }]}>$ {payment.amount?.toFixed(2)}</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={{ padding: 10, fontStyle: 'italic', textAlign: 'center', color: '#888' }}>
                            {t.noPayments}
                        </Text>
                    )}
                </View>

                {/* Terms & Footer */}
                <View style={styles.footer}>
                    {settings.invoice_footer_text ? (
                        <Text>{settings.invoice_footer_text}</Text>
                    ) : (
                        <Text>{t.thankYou}</Text>
                    )}
                    <Text style={styles.terms}>{settings.invoice_terms_text}</Text>
                </View>

            </Page>
        </Document>
    );
};
