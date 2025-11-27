import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateReturnSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  items: z.array(
    z.object({
      id: z.string(),
      condition: z.enum(['GOOD', 'DAMAGED']).optional(),
    })
  ).optional(),
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

    // If updating items (condition changes), update them first
    if (data.items && returnRecord.status === 'PENDING') {
      for (const itemUpdate of data.items) {
        await prisma.returnItem.update({
          where: { id: itemUpdate.id },
          data: {
            condition: itemUpdate.condition,
          },
        });
      }
    }

    // If approving return, restore inventory only for GOOD items
    if (data.status === 'APPROVED' && returnRecord.status === 'PENDING') {
      // Refresh return record to get updated conditions
      const updatedReturnRecord = await prisma.return.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              part: true,
            },
          },
        },
      });

      if (!updatedReturnRecord) {
        return NextResponse.json({ error: 'Return not found' }, { status: 404 });
      }

      // Update inventory for each returned item based on condition
      for (const item of updatedReturnRecord.items) {
        const condition = item.condition || 'GOOD'; // Default to GOOD for backward compatibility
        if (condition === 'GOOD') {
          // Restore quantity to inventory for GOOD items
          await prisma.part.update({
            where: { id: item.partId },
            data: {
              quantity: {
                increment: item.quantity,
              },
            },
          });

          // Create inventory transaction for GOOD items
          await prisma.inventoryTransaction.create({
            data: {
              partId: item.partId,
              type: 'RETURN',
              quantity: item.quantity,
              reason: `Return approved for ticket ${returnRecord.ticketId}: ${item.reason || 'No reason provided'}`,
              ticketId: returnRecord.ticketId,
            },
          });
        } else if (condition === 'DAMAGED') {
          // Create DAMAGE_LOSS transaction for DAMAGED items (do NOT restore inventory)
          await prisma.inventoryTransaction.create({
            data: {
              partId: item.partId,
              type: 'DAMAGE_LOSS',
              quantity: item.quantity,
              reason: `Damaged part return for ticket ${returnRecord.ticketId}: ${item.reason || 'Part damaged during return'}`,
              ticketId: returnRecord.ticketId,
            },
          });
        }
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

