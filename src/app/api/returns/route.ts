import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createReturnSchema = z.object({
  ticketId: z.string(),
  reason: z.string().min(1),
  items: z.array(
    z.object({
      partId: z.string(),
      quantity: z.number().int().min(1),
      reason: z.string().optional(),
      condition: z.enum(['GOOD', 'DAMAGED']).optional().default('GOOD'),
    })
  ),
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
      include: {
        parts: {
          include: {
            part: true,
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Create return with items
    const returnRecord = await prisma.return.create({
      data: {
        ticketId: data.ticketId,
        reason: data.reason,
        status: 'PENDING',
        items: {
          create: data.items.map((item) => ({
            partId: item.partId,
            quantity: item.quantity,
            reason: item.reason,
            condition: item.condition || 'GOOD',
          })),
        },
      },
      include: {
        items: {
          include: {
            part: true,
          },
        },
      },
    });

    return NextResponse.json(returnRecord, { status: 201 });
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
              },
            },
          },
        },
        items: {
          include: {
            part: true,
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

