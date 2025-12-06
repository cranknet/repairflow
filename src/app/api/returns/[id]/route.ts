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

    // Admin-only check for approving/rejecting returns
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only administrators can approve or reject returns' },
        { status: 403 }
      );
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
            status: true,
          },
        },
      },
    });

    if (!returnRecord) {
      return NextResponse.json({ error: 'Return not found' }, { status: 404 });
    }

    const updateData: any = {
      status: data.status,
    };

    // Handle return status changes
    if (data.status === 'APPROVED' && returnRecord.status !== 'APPROVED') {
      // When return is approved, set handledAt and handledBy
      updateData.handledAt = new Date();
      updateData.handledBy = session.user.id;

      // Change ticket status to RETURNED
      await prisma.ticket.update({
        where: { id: returnRecord.ticketId },
        data: {
          status: 'RETURNED',
          statusHistory: {
            create: {
              status: 'RETURNED',
              notes: `Return approved. Refund amount: ${returnRecord.refundAmount}. Ticket status changed to RETURNED.`,
            },
          },
        },
      });
    } else if (data.status === 'REJECTED' && returnRecord.status === 'PENDING') {
      // When return is rejected, set handledAt and handledBy
      updateData.handledAt = new Date();
      updateData.handledBy = session.user.id;

      // Keep ticket status unchanged (remain REPAIRED)
      await prisma.ticketStatusHistory.create({
        data: {
          ticketId: returnRecord.ticketId,
          status: returnRecord.ticket.status, // Current status (REPAIRED or COMPLETED)
          notes: `Return rejected. Ticket remains ${returnRecord.ticket.status}.`,
        },
      });
    }

    const updatedReturn = await prisma.return.update({
      where: { id },
      data: updateData,
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin-only check for deleting returns
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only administrators can delete returns' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Find return record with ticket
    const returnRecord = await prisma.return.findUnique({
      where: { id },
      include: {
        ticket: true,
      },
    });

    if (!returnRecord) {
      return NextResponse.json({ error: 'Return not found' }, { status: 404 });
    }

    // Revert ticket status back to original if ticket is currently RETURNED
    if (returnRecord.ticket.status === 'RETURNED') {
      // Use stored original status, fallback to REPAIRED for backward compatibility
      const restoredStatus = returnRecord.originalTicketStatus || 'REPAIRED';
      await prisma.ticket.update({
        where: { id: returnRecord.ticketId },
        data: {
          status: restoredStatus,
          statusHistory: {
            create: {
              status: restoredStatus,
              notes: `Return deleted. Ticket status reverted from RETURNED to ${restoredStatus}.`,
            },
          },
        },
      });
    } else {
      // If ticket is not RETURNED, just add a status history note
      await prisma.ticketStatusHistory.create({
        data: {
          ticketId: returnRecord.ticketId,
          status: returnRecord.ticket.status,
          notes: `Return deleted. Ticket status unchanged.`,
        },
      });
    }

    // Delete the return record
    await prisma.return.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Return deleted successfully' });
  } catch (error) {
    console.error('Error deleting return:', error);
    return NextResponse.json(
      { error: 'Failed to delete return' },
      { status: 500 }
    );
  }
}

