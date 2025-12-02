import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { z } from 'zod';

const satisfactionSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  phoneNumber: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  token: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validationResult = satisfactionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'satisfaction.no_customer_info' },
        { status: 400 }
      );
    }

    const { rating, comment, phoneNumber, name, email, token } = validationResult.data;

    // Fetch ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!ticket || !ticket.customer.email) {
      return NextResponse.json(
        { error: 'satisfaction.no_customer_info' },
        { status: 400 }
      );
    }

    const customerEmail = ticket.customer.email.trim().toLowerCase();
    const customerName = ticket.customer.name?.trim().toLowerCase() || '';

    // Verification strategies (in order)
    let verifiedBy: 'TOKEN' | 'EMAIL' | 'AUTH' | null = null;

    // 1. Token verification: Validate ticket + tracking code match
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

        if (ticketByToken) {
          verifiedBy = 'TOKEN';
        }
      }
    }

    // 2. Email verification: Check session cookie OR validate email match
    if (!verifiedBy && email) {
      const providedEmail = email.trim().toLowerCase();
      
      // Check session cookie
      const cookieStore = await cookies();
      const cookieName = `satisfaction_verified_${id}`;
      const cookie = cookieStore.get(cookieName);

      if (cookie?.value === 'verified' && providedEmail === customerEmail) {
        verifiedBy = 'EMAIL';
      } else if (providedEmail === customerEmail) {
        // Direct email match (for cases where cookie wasn't set but email matches)
        verifiedBy = 'EMAIL';
      }
    }

    // 4. Auth verification: Check session.user.id === ticket.customerId
    if (!verifiedBy) {
      const session = await auth();
      if (session?.user?.id && ticket.customerId === session.user.id) {
        verifiedBy = 'AUTH';
      }
    }

    // Admin override check (if enabled)
    const allowOverride = await prisma.settings.findUnique({
      where: { key: 'ALLOW_SATISFACTION_OVERRIDE' },
    });

    if (!verifiedBy && allowOverride?.value === 'true') {
      const session = await auth();
      if (session?.user?.role === 'ADMIN') {
        // Admin can override, but we still need customer email
        if (!email || email.trim().toLowerCase() !== customerEmail) {
          return NextResponse.json(
            { error: 'satisfaction.error.not_customer' },
            { status: 403 }
          );
        }
        verifiedBy = 'AUTH'; // Use AUTH for admin override
      }
    }

    // If no verification method passed, reject
    if (!verifiedBy) {
      return NextResponse.json(
        { error: 'satisfaction.error.not_customer' },
        { status: 403 }
      );
    }

    // Check for existing rating (unique ticketId + customerEmail)
    const existingRating = await prisma.satisfactionRating.findUnique({
      where: {
        ticketId_customerEmail: {
          ticketId: id,
          customerEmail: customerEmail,
        },
      },
    });

    if (existingRating) {
      return NextResponse.json(
        { error: 'satisfaction.duplicate_error' },
        { status: 409 }
      );
    }

    // Create rating
    const ratingRecord = await prisma.satisfactionRating.create({
      data: {
        ticketId: id,
        customerId: ticket.customerId,
        customerEmail: customerEmail,
        rating,
        comment: comment || null,
        phoneNumber: phoneNumber || null,
        verifiedBy,
      },
      include: {
        ticket: {
          select: {
            ticketNumber: true,
          },
        },
      },
    });

    return NextResponse.json(ratingRecord, { status: 200 });
  } catch (error) {
    console.error('Error submitting satisfaction rating:', error);
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'satisfaction.duplicate_error' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'satisfaction.no_customer_info' },
      { status: 500 }
    );
  }
}

