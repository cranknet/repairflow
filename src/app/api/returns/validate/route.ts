import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const ticketId = searchParams.get('ticketId');

    if (!ticketId) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
        { status: 400 }
      );
    }

    // Check ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return NextResponse.json(
        { valid: false, error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Check ticket status is REPAIRED
    if (ticket.status !== 'REPAIRED') {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Ticket must be in REPAIRED status to create return',
          details: { currentStatus: ticket.status }
        },
        { status: 400 }
      );
    }

    // Check no active return exists (status = PENDING or APPROVED)
    const existingReturn = await prisma.return.findFirst({
      where: {
        ticketId: ticketId,
        status: {
          in: ['PENDING', 'APPROVED']
        }
      },
    });

    if (existingReturn) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'A return request already exists for this ticket',
          details: { returnId: existingReturn.id, returnStatus: existingReturn.status }
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Error validating return:', error);
    return NextResponse.json(
      { error: 'Failed to validate return' },
      { status: 500 }
    );
  }
}

