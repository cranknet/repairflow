import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, token } = body;

    if (!name) {
      return NextResponse.json(
        { ok: false, error: 'satisfaction.no_customer_info' },
        { status: 400 }
      );
    }

    // Find ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { ok: false, error: 'satisfaction.no_customer_info' },
        { status: 404 }
      );
    }

    // Verify name matches (case-insensitive, trimmed)
    const providedName = name.trim().toLowerCase();
    const customerName = ticket.customer.name?.trim().toLowerCase();

    if (!customerName || providedName !== customerName) {
      return NextResponse.json(
        { ok: false, error: 'satisfaction.error.not_customer' },
        { status: 403 }
      );
    }

    // Optional: Verify token if provided
    if (token) {
      const searchParams = request.nextUrl.searchParams;
      const ticketNumber = searchParams.get('ticket');
      const trackingCode = searchParams.get('code');

      if (ticketNumber && trackingCode) {
        const ticketByToken = await prisma.ticket.findFirst({
          where: {
            ticketNumber: ticketNumber.trim().toUpperCase(),
            trackingCode: trackingCode.trim().toUpperCase(),
            id: ticket.id,
          },
        });

        if (!ticketByToken) {
          return NextResponse.json(
            { ok: false, error: 'satisfaction.error.not_customer' },
            { status: 403 }
          );
        }
      }
    }

    // Set httpOnly session cookie valid for 24 hours
    const cookieStore = await cookies();
    const cookieName = `satisfaction_verified_${id}`;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    cookieStore.set(cookieName, 'verified', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error verifying customer:', error);
    return NextResponse.json(
      { ok: false, error: 'satisfaction.no_customer_info' },
      { status: 500 }
    );
  }
}

