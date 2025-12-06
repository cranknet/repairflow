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
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ tickets: [] });
    }

    const searchTerm = query.trim();

    // Search for repaired tickets by customer name or ticket number
    // Filter: status = REPAIRED, no existing returns (PENDING or APPROVED)
    const tickets = await prisma.ticket.findMany({
      where: {
        status: {
          in: ['REPAIRED', 'COMPLETED']
        },
        OR: [
          {
            customer: {
              name: {
                contains: searchTerm,
              },
            },
          },
          {
            ticketNumber: {
              contains: searchTerm,
            },
          },
        ],
        returns: {
          none: {
            status: {
              in: ['PENDING', 'APPROVED'],
            },
          },
        },
      },
      select: {
        id: true,
        ticketNumber: true,
        status: true,
        deviceBrand: true,
        deviceModel: true,
        finalPrice: true,
        estimatedPrice: true,
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20, // Limit to 20 results
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('Error searching tickets:', error);
    return NextResponse.json(
      { error: 'Failed to search tickets' },
      { status: 500 }
    );
  }
}

