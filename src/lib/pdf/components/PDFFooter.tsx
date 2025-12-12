import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { styles } from '../styles';
import { PDFComponentProps } from '../types';

export const PDFFooter = ({ settings, t }: PDFComponentProps) => {
    return (
        <View style={styles.footer}>
            {settings.invoice_footer_text ? (
                <Text>{settings.invoice_footer_text}</Text>
            ) : (
                <Text>{t.thankYou}</Text>
            )}
            <Text style={styles.terms}>{settings.invoice_terms_text}</Text>
        </View>
    );
};
