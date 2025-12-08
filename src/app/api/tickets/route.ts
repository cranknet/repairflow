import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { emitEvent } from '@/lib/events/emitter';
import { getTicketSettings, getWarrantySettings } from '@/lib/settings';

const createTicketSchema = z.object({
  customerId: z.string(),
  deviceBrand: z.string().min(1),
  deviceModel: z.string().min(1),
  deviceIssue: z.string().min(1),
  deviceConditionFront: z.string().optional(),
  deviceConditionBack: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  estimatedPrice: z.number().min(0).optional(),
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

    const where: any = {
      deletedAt: null, // Exclude soft-deleted tickets
    };
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

    // Get settings for ticket creation
    const [ticketSettings, warrantySettings] = await Promise.all([
      getTicketSettings(),
      getWarrantySettings(),
    ]);

    // Validate required device photos if setting is enabled
    if (ticketSettings.requireDevicePhotos) {
      if (!data.deviceConditionFront || !data.deviceConditionBack) {
        return NextResponse.json(
          { error: 'Device photos (front and back) are required' },
          { status: 400 }
        );
      }
    }

    // Validate estimated price if setting is enabled
    if (ticketSettings.requireEstimatedPrice) {
      if (data.estimatedPrice === undefined || data.estimatedPrice <= 0) {
        return NextResponse.json(
          { error: 'Estimated price is required and must be greater than 0' },
          { status: 400 }
        );
      }
    }

    // Generate unique ticket number with prefix from settings
    const prefix = ticketSettings.ticketNumberPrefix || 'T';
    const ticketNumber = `${prefix}-${Date.now()}`;
    const trackingCode = nanoid(8).toUpperCase();

    // Apply defaults from settings
    const priority = data.priority || ticketSettings.defaultPriority || 'MEDIUM';
    const warrantyDays = data.warrantyDays ?? warrantySettings.defaultWarrantyDays;
    const warrantyText = data.warrantyText || warrantySettings.defaultWarrantyText;

    const ticket = await prisma.ticket.create({
      data: {
        customerId: data.customerId,
        deviceBrand: data.deviceBrand,
        deviceModel: data.deviceModel,
        deviceIssue: data.deviceIssue,
        deviceConditionFront: data.deviceConditionFront,
        deviceConditionBack: data.deviceConditionBack,
        priority,
        estimatedPrice: data.estimatedPrice ?? 0,
        assignedToId: data.assignedToId,
        warrantyDays,
        warrantyText,
        notes: data.notes,
        ticketNumber,
        trackingCode,
        status: 'RECEIVED',
        paid: ticketSettings.autoMarkAsPaid,
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

    // Emit ticket.created event
    emitEvent({
      eventId: nanoid(),
      entityType: 'ticket',
      entityId: ticket.id,
      action: 'created',
      actorId: session.user.id,
      actorName: session.user.name || session.user.username,
      timestamp: new Date(),
      summary: `Ticket ${ticketNumber} created for ${ticket.customer.name}`,
      meta: {
        ticketNumber: ticket.ticketNumber,
        customerName: ticket.customer.name,
      },
      customerId: ticket.customerId,
      ticketId: ticket.id,
      device: {
        brand: ticket.deviceBrand,
        model: ticket.deviceModel,
        issue: ticket.deviceIssue,
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



