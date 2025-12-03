/**
 * API Route: POST /api/v2/returns/[id]/reject
 * Reject a return with reason
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { rejectReturnV2 } from '@/lib/finance/returns.service';

const rejectReturnSchema = z.object({
    reason: z.string().min(3, 'Rejection reason must be at least 3 characters'),
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
                { error: 'Only administrators can reject returns' },
                { status: 403 }
            );
        }

        const { id } = await params;
        const body = await request.json();
        const { reason } = rejectReturnSchema.parse(body);

        // Call the service
        const result = await rejectReturnV2({
            returnId: id,
            userId: session.user.id,
            reason,
        });

        return NextResponse.json({
            success: true,
            data: result,
            message: 'Return rejected successfully',
        });
    } catch (error: any) {
        console.error('Error rejecting return:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                error: 'Failed to reject return',
                message: error.message || 'Unknown error'
            },
            { status: 500 }
        );
    }
}
