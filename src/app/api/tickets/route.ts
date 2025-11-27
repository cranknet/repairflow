import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { nanoid } from 'nanoid';

const createTicketSchema = z.object({
  customerId: z.string(),
  deviceBrand: z.string().min(1),
  deviceModel: z.string().min(1),
  deviceIssue: z.string().min(1),
  deviceConditionFront: z.string().optional(),
  deviceConditionBack: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  estimatedPrice: z.number().min(0),
  assignedToId: z.string().optional(),
  warrantyDays: z.number().int().min(0).optional(),
  warrantyText: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');

    const where: any = {};
    if (status === 'active') {
      where.status = { notIn: ['COMPLETED', 'CANCELLED'] };
    } else if (status) {
      where.status = status;
    }
    if (customerId) {
      where.customerId = customerId;
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        customer: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createTicketSchema.parse(body);

    // Generate unique ticket number and tracking code
    const ticketNumber = `TKT-${Date.now()}`;
    const trackingCode = nanoid(8).toUpperCase();

    const ticket = await prisma.ticket.create({
      data: {
        ...data,
        ticketNumber,
        trackingCode,
        status: 'RECEIVED',
        statusHistory: {
          create: {
            status: 'RECEIVED',
            notes: 'Ticket created',
          },
        },
      },
      include: {
        customer: true,
        assignedTo: true,
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error creating ticket:', error.errors);
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating ticket:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create ticket';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

