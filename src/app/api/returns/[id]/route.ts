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
        items: {
          include: {
            part: true,
          },
        },
      },
    });

    if (!returnRecord) {
      return NextResponse.json({ error: 'Return not found' }, { status: 404 });
    }

    // If approving return, restore inventory
    if (data.status === 'APPROVED' && returnRecord.status === 'PENDING') {
      // Update inventory for each returned item
      for (const item of returnRecord.items) {
        // Restore quantity to inventory
        await prisma.part.update({
          where: { id: item.partId },
          data: {
            quantity: {
              increment: item.quantity,
            },
          },
        });

        // Create inventory transaction
        await prisma.inventoryTransaction.create({
          data: {
            partId: item.partId,
            type: 'RETURN',
            quantity: item.quantity,
            reason: `Return approved for ticket ${returnRecord.ticketId}: ${item.reason || 'No reason provided'}`,
            ticketId: returnRecord.ticketId,
          },
        });
      }
    }

    const updatedReturn = await prisma.return.update({
      where: { id },
      data: {
        status: data.status,
      },
      include: {
        items: {
          include: {
            part: true,
          },
        },
        ticket: {
          select: {
            ticketNumber: true,
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

