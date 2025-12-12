import { StyleSheet } from '@react-pdf/renderer';

// Styles
export const styles = StyleSheet.create({
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
