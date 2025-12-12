import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { styles } from '../styles';
import { PDFComponentProps } from '../types';

export const PDFHeader = ({ ticket, settings, t, isRTL, totals }: PDFComponentProps) => {
    const flexDirection = isRTL ? 'row-reverse' : 'row';
    const { balanceDue, totalPaid } = totals || { balanceDue: 0, totalPaid: 0 };

    return (
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
    );
};
