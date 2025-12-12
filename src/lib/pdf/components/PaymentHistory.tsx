import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { styles } from '../styles';
import { PDFComponentProps } from '../types';

export const PaymentHistory = ({ ticket, t, isRTL }: PDFComponentProps) => {
    const flexDirection = isRTL ? 'row-reverse' : 'row';
    const textAlign = isRTL ? 'right' : 'left';

    return (
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
    );
};
