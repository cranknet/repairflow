import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateReturnSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateReturnSchema.parse(body);

    const returnRecord = await prisma.return.findUnique({
      where: { id },
      include: {
        ticket: {
          select: {
            ticketNumber: true,
          },
        },
      },
    });

    if (!returnRecord) {
      return NextResponse.json({ error: 'Return not found' }, { status: 404 });
    }

    // If rejecting return, optionally allow reverting ticket status from RETURNED
    if (data.status === 'REJECTED' && returnRecord.status === 'PENDING') {
      // Optionally revert ticket status - for now, we'll keep it as RETURNED
      // This can be changed later if needed
    }

    const updatedReturn = await prisma.return.update({
      where: { id },
      data: {
        status: data.status,
      },
      include: {
        ticket: {
          select: {
            ticketNumber: true,
            customer: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedReturn);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating return:', error);
    return NextResponse.json(
      { error: 'Failed to update return' },
      { status: 500 }
    );
  }
}

