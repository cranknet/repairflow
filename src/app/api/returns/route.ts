import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createReturnSchema = z.object({
  ticketId: z.string(),
  reason: z.string().min(1),
  refundAmount: z.number().min(0),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Check if ticket is already returned
    if (ticket.status === 'RETURNED') {
      return NextResponse.json(
        { error: 'Ticket is already returned' },
        { status: 400 }
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

    // Create return and automatically mark ticket as RETURNED
    const returnRecord = await prisma.return.create({
      data: {
        ticketId: data.ticketId,
        reason: data.reason,
        refundAmount: data.refundAmount,
        status: 'PENDING',
      },
    });

    // Update ticket status to RETURNED
    await prisma.ticket.update({
      where: { id: data.ticketId },
      data: {
        status: 'RETURNED',
        statusHistory: {
          create: {
            status: 'RETURNED',
            notes: `Ticket returned. Refund amount: ${data.refundAmount}`,
          },
        },
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

