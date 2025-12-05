/**
 * API Route: POST /api/v2/returns/[id]/approve
 * Approve a return with full transactional workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { approveReturnV2 } from '@/lib/finance/returns.service';

const approveReturnSchema = z.object({
    paymentMethod: z.string().optional().default('CASH'),
    partialAmount: z.number().positive().optional(),
    notes: z.string().optional(),
    createInventoryAdjustment: z.boolean().optional().default(false),
});

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Admin-only check
        if (session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Only administrators can approve returns' },
                { status: 403 }
            );
        }

        const { id } = await params;
        const body = await request.json();
        const validated = approveReturnSchema.parse(body);

        // Call the service
        const result = await approveReturnV2({
            returnId: id,
            userId: session.user.id,
            ...validated,
        });

        return NextResponse.json({
            success: true,
            data: result,
            message: 'Return approved and refund processed successfully',
        });
    } catch (error: any) {
        console.error('Error approving return:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                error: 'Failed to approve return',
                message: error.message || 'Unknown error'
            },
            { status: 500 }
        );
    }
}
