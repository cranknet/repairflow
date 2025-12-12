import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { styles } from '../styles';
import { PDFComponentProps } from '../types';

export const CustomerDeviceSection = ({ ticket, t, isRTL }: PDFComponentProps) => {
    const flexDirection = isRTL ? 'row-reverse' : 'row';
    const textAlign = isRTL ? 'right' : 'left';

    return (
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
    );
};
