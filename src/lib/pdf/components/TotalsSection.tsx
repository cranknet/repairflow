import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { styles } from '../styles';
import { PDFComponentProps } from '../types';

export const TotalsSection = ({ t, isRTL, totals }: PDFComponentProps) => {
    const flexDirection = isRTL ? 'row-reverse' : 'row';
    // Default to 0 if undefined to prevent crash
    const { subtotal = 0, finalTotal = 0, totalPaid = 0, balanceDue = 0 } = totals || {};

    return (
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
    );
};
