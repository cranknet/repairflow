import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Tracking code is required' }, { status: 400 });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { trackingCode: code },
      include: {
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Return limited information for public tracking
    return NextResponse.json({
      ticketNumber: ticket.ticketNumber,
      status: ticket.status,
      deviceBrand: ticket.deviceBrand,
      deviceModel: ticket.deviceModel,
      deviceIssue: ticket.deviceIssue,
      finalPrice: ticket.finalPrice,
      createdAt: ticket.createdAt,
      statusHistory: ticket.statusHistory,
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}

