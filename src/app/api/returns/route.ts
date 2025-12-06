import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createReturnSchema = z.object({
  ticketId: z.string(),
  reason: z.string().min(1),
  refundAmount: z.number().min(0),
  returnedTo: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin-only check for creating returns
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only administrators can create returns' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = createReturnSchema.parse(body);

    // Verify ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: data.ticketId },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Validate that ticket status is REPAIRED or COMPLETED
    if (ticket.status !== 'REPAIRED' && ticket.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Only repaired or completed tickets can be returned' },
        { status: 400 }
      );
    }

    // Revalidate on create to handle race conditions - check for active returns
    const existingReturn = await prisma.return.findFirst({
      where: {
        ticketId: data.ticketId,
        status: {
          in: ['PENDING', 'APPROVED']
        }
      },
    });

    if (existingReturn) {
      return NextResponse.json(
        { error: 'A return request already exists for this ticket. Please refresh the page.' },
        { status: 409 }
      );
    }

    // Validate refund amount doesn't exceed final price
    const maxRefund = ticket.finalPrice || ticket.estimatedPrice;
    if (data.refundAmount > maxRefund) {
      return NextResponse.json(
        { error: `Refund amount cannot exceed ticket price (${maxRefund})` },
        { status: 400 }
      );
    }

    // Create return record - ticket status remains as is until return is approved
    // Store original status for potential restoration if return is deleted
    const returnRecord = await prisma.return.create({
      data: {
        ticketId: data.ticketId,
        reason: data.reason,
        refundAmount: data.refundAmount,
        returnedTo: data.returnedTo || null,
        notes: data.notes || null,
        createdBy: session.user.id,
        status: 'PENDING',
        originalTicketStatus: ticket.status, // Store for restoration
      },
    });

    // Add status history note that return was created (ticket stays in current status)
    await prisma.ticketStatusHistory.create({
      data: {
        ticketId: data.ticketId,
        status: ticket.status, // Keep current status
        notes: `Return request created. Refund amount: ${data.refundAmount}. Ticket remains ${ticket.status} until return is approved.`,
      },
    });

    const returnWithTicket = await prisma.return.findUnique({
      where: { id: returnRecord.id },
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

    return NextResponse.json(returnWithTicket, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating return:', error);
    return NextResponse.json(
      { error: 'Failed to create return' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const ticketId = searchParams.get('ticketId');

    const where: any = {};
    if (ticketId) {
      where.ticketId = ticketId;
    }

    const returns = await prisma.return.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(returns);
  } catch (error) {
    console.error('Error fetching returns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch returns' },
      { status: 500 }
    );
  }
}

