import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { styles } from '../styles';
import { PDFComponentProps } from '../types';

export const ItemsTable = ({ ticket, t, isRTL }: PDFComponentProps) => {
    const flexDirection = isRTL ? 'row-reverse' : 'row';
    const textAlign = isRTL ? 'right' : 'left';

    return (
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
        </View>
    );
};
