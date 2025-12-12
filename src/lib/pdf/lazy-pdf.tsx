/**
 * Lazy PDF Generator
 * 
 * This module provides dynamic imports for @react-pdf/renderer to avoid
 * loading the ~500KB library until actually needed for printing.
 * 
 * Usage:
 *   const { generateInvoicePDF } = await import('@/lib/pdf/lazy-pdf');
 *   const pdfStream = await generateInvoicePDF(props);
 */

import type { InvoicePDFProps } from './types';

/**
 * Dynamically generate a ticket invoice PDF
 * Only loads @react-pdf/renderer when called
 */
export async function generateInvoicePDF(props: InvoicePDFProps) {
    // Dynamic imports to avoid bundling ~500KB react-pdf until needed
    const [{ renderToStream }, { InvoicePDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('../pdf-generator'),
    ]);

    return renderToStream(<InvoicePDF {...props} />);
}

/**
 * Check if PDF generation is available (always true in Node.js and browser)
 */
export function isPDFAvailable(): boolean {
    return true;
}
