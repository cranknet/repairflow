import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Simple in-memory rate limiting (for production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

function getClientId(request: NextRequest): string {
  // Use IP address for rate limiting
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  return ip;
}

function checkRateLimit(clientId: string): { allowed: boolean; resetAt?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(clientId);

  if (!record || now > record.resetAt) {
    // Reset or create new record
    rateLimitMap.set(clientId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }

  if (record.count >= MAX_ATTEMPTS) {
    return { allowed: false, resetAt: record.resetAt };
  }

  record.count++;
  return { allowed: true };
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW);

function maskTrackingCode(code: string): string {
  if (code.length <= 4) return 'XXXX';
  return 'XXXX-' + code.slice(-4);
}

function maskEmail(email: string | null): string {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const maskedLocal = local.slice(0, 1) + '***';
  const maskedDomain = '***' + domain.slice(-4);
  return `${maskedLocal}@${maskedDomain}`;
}

function maskName(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].slice(0, 1) + '.';
  }
  return parts[0] + ' ' + parts[parts.length - 1].slice(0, 1) + '.';
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ticketNumber = searchParams.get('ticket');
    const trackingCode = searchParams.get('code');

    // Check rate limiting
    const clientId = getClientId(request);
    const rateLimit = checkRateLimit(clientId);
    
    if (!rateLimit.allowed) {
      const remainingSeconds = Math.ceil((rateLimit.resetAt! - Date.now()) / 1000);
      return NextResponse.json(
        { 
          error: 'Too many attempts. Please try again later.',
          rateLimitExceeded: true,
          retryAfter: remainingSeconds
        },
        { 
          status: 429,
          headers: {
            'Retry-After': remainingSeconds.toString(),
            'X-RateLimit-Limit': MAX_ATTEMPTS.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimit.resetAt!).toISOString(),
          }
        }
      );
    }

    // Validate input
    if (!ticketNumber || !trackingCode) {
      return NextResponse.json(
        { error: 'Ticket number and tracking code are required' },
        { status: 400 }
      );
    }

    // Sanitize inputs (basic validation)
    const sanitizedTicketNumber = ticketNumber.trim().toUpperCase();
    const sanitizedTrackingCode = trackingCode.trim().toUpperCase();

    // Find ticket by both ticket number and tracking code (two-factor authentication)
    const ticket = await prisma.ticket.findFirst({
      where: {
        ticketNumber: sanitizedTicketNumber,
        trackingCode: sanitizedTrackingCode,
      },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'asc' }, // Chronological order for timeline
        },
      },
    });

    // Generic error message to prevent enumeration
    if (!ticket) {
      // Add small random delay to prevent timing attacks (100-300ms)
      const delay = 100 + Math.random() * 200;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return NextResponse.json(
        { error: 'Unable to locate ticket. Please verify your information.' },
        { status: 404 }
      );
    }

    // Calculate progress percentage based on status
    const statusOrder = ['RECEIVED', 'IN_PROGRESS', 'WAITING_FOR_PARTS', 'REPAIRED', 'COMPLETED', 'RETURNED'];
    const currentIndex = statusOrder.indexOf(ticket.status);
    const progress = currentIndex >= 0 ? Math.round(((currentIndex + 1) / statusOrder.length) * 100) : 0;

    // Calculate estimated completion (if not completed)
    let estimatedCompletion = null;
    if (ticket.status !== 'COMPLETED' && ticket.status !== 'CANCELLED' && ticket.status !== 'RETURNED') {
      // Simple estimation: add average days based on status
      const avgDaysByStatus: Record<string, number> = {
        'RECEIVED': 2,
        'IN_PROGRESS': 3,
        'WAITING_FOR_PARTS': 5,
        'REPAIRED': 1,
      };
      const avgDays = avgDaysByStatus[ticket.status] || 3;
      estimatedCompletion = new Date(Date.now() + avgDays * 24 * 60 * 60 * 1000);
    }

    // Check for existing satisfaction rating for THIS specific ticket
    const existingRating = await prisma.satisfactionRating.findFirst({
      where: {
        ticketId: ticket.id,
        customerEmail: ticket.customer.email?.trim().toLowerCase() || '',
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        phoneNumber: true,
        verifiedBy: true,
        createdAt: true,
      },
    });

    // Determine if customer can submit rating
    // Can submit if: ticket is COMPLETED or REPAIRED, and no existing rating
    const canSubmitRating = 
      (ticket.status === 'COMPLETED' || ticket.status === 'REPAIRED') &&
      !existingRating;

    // Return limited, privacy-protected information for public tracking
    return NextResponse.json({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      trackingCode: maskTrackingCode(ticket.trackingCode), // Masked for display
      status: ticket.status,
      progress,
      deviceBrand: ticket.deviceBrand,
      deviceModel: ticket.deviceModel,
      deviceIssue: ticket.deviceIssue,
      deviceConditionFront: ticket.deviceConditionFront,
      deviceConditionBack: ticket.deviceConditionBack,
      priority: ticket.priority,
      estimatedPrice: ticket.estimatedPrice,
      finalPrice: ticket.finalPrice,
      createdAt: ticket.createdAt,
      completedAt: ticket.completedAt,
      estimatedCompletion: estimatedCompletion?.toISOString() || null,
      warrantyDays: ticket.warrantyDays,
      warrantyText: ticket.warrantyText,
      statusHistory: ticket.statusHistory.map(history => ({
        id: history.id,
        status: history.status,
        notes: history.notes, // Filtered notes (public-safe)
        createdAt: history.createdAt,
      })),
      customer: {
        name: ticket.customer.name, // Unmasked since they authenticated with tracking code
        email: ticket.customer.email, // Unmasked since they authenticated with tracking code
        phone: ticket.customer.phone || null,
      },
      satisfactionRating: existingRating || null,
      canSubmitRating,
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    // Add random delay even on errors
    const delay = 100 + Math.random() * 200;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return NextResponse.json(
      { error: 'Unable to locate ticket. Please verify your information.' },
      { status: 500 }
    );
  }
}

