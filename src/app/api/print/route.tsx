import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { renderToStream } from '@react-pdf/renderer';
import { InvoicePDF } from '@/lib/pdf-generator';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { ticketId, format, language = 'en' } = body;

        if (!ticketId) {
            return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
        }

        // Fetch Full Ticket Data
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: {
                customer: true,
                parts: {
                    include: {
                        part: true
                    }
                },
                payments: {
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                priceAdjustments: true,
            }
        });

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        // Fetch Settings
        const settingsRaw = await prisma.settings.findMany({
            where: {
                key: {
                    in: ['company_name', 'company_address', 'company_phone', 'company_email', 'invoice_footer_text', 'invoice_terms_text']
                }
            }
        });

        const settings = settingsRaw.reduce((acc: Record<string, string>, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);

        if (format === 'invoice') {
            // Generate PDF
            const stream = await renderToStream(
                <InvoicePDF
                    ticket={ticket}
                    settings={settings}
                    language={language as 'en' | 'fr' | 'ar'}
                />
            );

            // Convert stream to buffer to return (or stream directly)
            // Next.js App Router can return a Response with a ReadableStream

            return new NextResponse(stream as any, {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `inline; filename="Invoice-${ticket.ticketNumber}.pdf"`,
                },
            });
        }

        // For labels and receipts, we might still handle them client-side or return data here
        // But for now, if format is not invoice, we just return the data for client-side rendering
        // or extend this API to generate those images too. 
        // Given the plan to keep window.print for labels (Phase 1), we return success.

        return NextResponse.json({ success: true, message: 'Format handled client-side' });

    } catch (error) {
        console.error('Print API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
