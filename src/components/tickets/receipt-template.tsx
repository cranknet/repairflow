'use client';

import { QRCodeSVG } from 'qrcode.react';
import { format, addDays } from 'date-fns';
import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/language-context';

interface ReceiptTemplateProps {
    ticket: any;
    language?: 'en' | 'fr' | 'ar';
}

export function ReceiptTemplate({ ticket, language = 'en' }: ReceiptTemplateProps) {
    const { t: tOrig } = useLanguage();
    const [companyName, setCompanyName] = useState<string>('RepairFlow');
    const [companyPhone, setCompanyPhone] = useState<string>('');
    const [companyAddress, setCompanyAddress] = useState<string>('');

    // Helper for translations since we might pass language prop explicitly
    // In a real app, we'd use a proper i18n hook that accepts lang, or just rely on the prop to switch context
    // For now, simple mapping for specific receipt terms
    const terms = {
        en: {
            customer: 'CUSTOMER',
            device: 'DEVICE',
            issue: 'Issue',
            pricing: 'PRICING',
            est: 'Est. Price',
            final: 'Final Price',
            payments: 'PAYMENTS',
            date: 'Date',
            amount: 'Amount',
            method: 'Method',
            balance: 'Balance Due',
            warranty: 'WARRANTY',
            terms: 'TERMS & CONDITIONS',
            thankYou: 'Thank you for your business!'
        },
        fr: {
            customer: 'CLIENT',
            device: 'APPAREIL',
            issue: 'Problème',
            pricing: 'PRIX',
            est: 'Prix Est.',
            final: 'Prix Final',
            payments: 'PAIEMENTS',
            date: 'Date',
            amount: 'Montant',
            method: 'Méthode',
            balance: 'Reste à payer',
            warranty: 'GARANTIE',
            terms: 'CONDITIONS GÉNÉRALES',
            thankYou: 'Merci de votre confiance !'
        },
        ar: {
            customer: 'العميل',
            device: 'الجهاز',
            issue: 'المشكلة',
            pricing: 'السعر',
            est: 'السعر المقدر',
            final: 'السعر النهائي',
            payments: 'الدفعات',
            date: 'التاريخ',
            amount: 'المبلغ',
            method: 'الطريقة',
            balance: 'المتبقي',
            warranty: 'الضمان',
            terms: 'الشروط والأحكام',
            thankYou: 'شكراً لتعاملكم معنا!'
        }
    };

    const T = terms[language] || terms.en;
    const isRTL = language === 'ar';

    // Styles for RTL
    const dir = isRTL ? 'rtl' : 'ltr';
    const textAlign = isRTL ? 'right' : 'left';

    const trackUrl = useMemo(() => {
        if (typeof window !== 'undefined' && ticket.trackingCode) {
            const baseUrl = window.location.origin;
            return `${baseUrl}/track?code=${ticket.trackingCode}`;
        }
        return '';
    }, [ticket.trackingCode]);

    useEffect(() => {
        fetch('/api/settings/public')
            .then((res) => res.json())
            .then((data) => {
                if (data.company_name) setCompanyName(data.company_name);
                if (data.company_phone) setCompanyPhone(data.company_phone);
                if (data.company_address) setCompanyAddress(data.company_address);
            })
            .catch(console.error);
    }, []);

    // Calculate Balance
    const totalPaid = ticket.payments?.reduce((acc: number, p: any) => acc + (p.amount || 0), 0) || 0;
    const finalPrice = ticket.finalPrice ?? ticket.estimatedPrice ?? 0;
    const balanceDue = finalPrice - totalPaid;

    return (
        <div
            className="bg-white text-black"
            dir={dir}
            style={{
                width: '80mm',
                padding: '3mm',
                paddingBottom: '5mm', // Extra padding at bottom for cutter
                fontFamily: isRTL ? 'Arial, sans-serif' : 'monospace', // Monospace looks better for thermal receipt in EN
                fontSize: '11px',
                lineHeight: '1.4',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
            }}
        >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '4mm', borderBottom: '1px dashed #000', paddingBottom: '2mm' }}>
                <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '1mm' }}>{companyName}</div>
                {companyAddress && <div style={{ fontSize: '10px' }}>{companyAddress}</div>}
                {companyPhone && <div style={{ fontSize: '10px' }}>{companyPhone}</div>}
                <div style={{ marginTop: '2mm', fontWeight: 'bold' }}>#{ticket.ticketNumber}</div>
                <div style={{ fontSize: '10px' }}>{format(new Date(), 'yyyy-MM-dd HH:mm')}</div>
            </div>

            {/* Customer */}
            <div style={{ marginBottom: '3mm' }}>
                <div style={{ fontWeight: 'bold', borderBottom: '1px dotted #000', marginBottom: '1mm', textAlign }}>{T.customer}</div>
                <div style={{ textAlign }}>{ticket.customer?.name}</div>
                <div style={{ textAlign }}>{ticket.customer?.phone}</div>
            </div>

            {/* Device */}
            <div style={{ marginBottom: '3mm' }}>
                <div style={{ fontWeight: 'bold', borderBottom: '1px dotted #000', marginBottom: '1mm', textAlign }}>{T.device}</div>
                <div style={{ textAlign }}>{ticket.deviceBrand} {ticket.deviceModel}</div>
                <div style={{ fontSize: '10px', marginTop: '1px', textAlign }}>{T.issue}: {ticket.deviceIssue}</div>
            </div>

            {/* Pricing & Financials */}
            <div style={{ marginBottom: '3mm' }}>
                <div style={{ fontWeight: 'bold', borderBottom: '1px dotted #000', marginBottom: '1mm', textAlign }}>{T.pricing}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    <span>{T.final}:</span>
                    <span style={{ fontWeight: 'bold' }}>${finalPrice.toFixed(2)}</span>
                </div>
            </div>

            {/* Payment History */}
            {ticket.payments && ticket.payments.length > 0 && (
                <div style={{ marginBottom: '3mm' }}>
                    <div style={{ fontWeight: 'bold', borderBottom: '1px dotted #000', marginBottom: '1mm', textAlign }}>{T.payments}</div>
                    {ticket.payments.map((pay: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '1px', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                            <span style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>{format(new Date(pay.createdAt), 'MM/dd')} {pay.method}</span>
                            <span>${pay.amount?.toFixed(2)}</span>
                        </div>
                    ))}
                    <div style={{ borderTop: '1px solid #000', marginTop: '2mm', paddingTop: '1mm', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                        <span>{T.balance}:</span>
                        <span>${balanceDue.toFixed(2)}</span>
                    </div>
                </div>
            )}

            {/* Warranty */}
            {(ticket.warrantyDays || ticket.warrantyText) && (
                <div style={{ marginBottom: '3mm', textAlign: 'center', border: '1px solid #000', padding: '2mm', marginTop: '2mm' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{T.warranty}</div>
                    {ticket.warrantyDays && <div>{ticket.warrantyDays} Days</div>}
                    {ticket.completedAt && ticket.warrantyDays && (
                        <div style={{ fontSize: '9px' }}>Valid until: {format(addDays(new Date(ticket.completedAt), ticket.warrantyDays), 'yyyy-MM-dd')}</div>
                    )}
                </div>
            )}

            {/* QR Code */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 'auto', paddingTop: '4mm' }}>
                <QRCodeSVG value={trackUrl || ticket.trackingCode} size={100} />
                <div style={{ fontSize: '10px', marginTop: '1mm', fontFamily: 'monospace' }}>{ticket.trackingCode}</div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: '3mm', fontSize: '10px', fontStyle: 'italic' }}>
                {T.thankYou}
            </div>

        </div>
    );
}
