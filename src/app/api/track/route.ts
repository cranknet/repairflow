import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTrackingSettings } from '@/lib/settings';

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

export async function GET(request: NextRequest) {
  try {
    // Get tracking settings first
    const trackingSettings = await getTrackingSettings();

    // Check if tracking is enabled
    if (!trackingSettings.trackingEnabled) {
      return NextResponse.json(
        { error: 'Public tracking is not enabled' },
        { status: 403 }
      );
    }

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
        assignedTo: trackingSettings.showTechnicianOnTracking ? {
          select: {
            name: true,
            username: true,
          },
        } : false,
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

    // Calculate estimated completion (if not completed) - only if setting allows
    let estimatedCompletion = null;
    if (trackingSettings.showEtaOnTracking &&
      ticket.status !== 'COMPLETED' && ticket.status !== 'CANCELLED' && ticket.status !== 'RETURNED') {
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
    let existingRating = null;
    let canSubmitRating = false;

    if (trackingSettings.satisfactionRatingEnabled) {
      existingRating = await prisma.satisfactionRating.findFirst({
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
      canSubmitRating =
        (ticket.status === 'COMPLETED' || ticket.status === 'REPAIRED') &&
        !existingRating;
    }

    // Build response based on settings
    const response: Record<string, any> = {
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
      createdAt: ticket.createdAt,
      completedAt: ticket.completedAt,
      warrantyDays: ticket.warrantyDays,
      warrantyText: ticket.warrantyText,
      customer: {
        name: ticket.customer.name, // Unmasked since they authenticated with tracking code
        email: ticket.customer.email, // Unmasked since they authenticated with tracking code
        phone: trackingSettings.showPhoneOnTracking ? ticket.customer.phone : null,
      },
      // Settings-controlled fields
      showContactForm: trackingSettings.showContactForm,
      satisfactionRatingEnabled: trackingSettings.satisfactionRatingEnabled,
      canSubmitRating,
      welcomeMessage: trackingSettings.trackingWelcomeMessage,
      completionMessage: trackingSettings.trackingCompletionMessage,
    };

    // Conditionally include price information
    if (trackingSettings.showPriceOnTracking) {
      response.estimatedPrice = ticket.estimatedPrice;
      response.finalPrice = ticket.finalPrice;
    }

    // Conditionally include notes in status history
    if (trackingSettings.showNotesOnTracking) {
      response.statusHistory = ticket.statusHistory.map(history => ({
        id: history.id,
        status: history.status,
        notes: history.notes,
        createdAt: history.createdAt,
      }));
    } else {
      response.statusHistory = ticket.statusHistory.map(history => ({
        id: history.id,
        status: history.status,
        createdAt: history.createdAt,
      }));
    }

    // Conditionally include ETA
    if (trackingSettings.showEtaOnTracking) {
      response.estimatedCompletion = estimatedCompletion?.toISOString() || null;
    }

    // Conditionally include technician info
    if (trackingSettings.showTechnicianOnTracking && ticket.assignedTo) {
      response.assignedTo = {
        name: ticket.assignedTo.name || ticket.assignedTo.username,
      };
    }

    // Include satisfaction rating if enabled
    if (trackingSettings.satisfactionRatingEnabled) {
      response.satisfactionRating = existingRating || null;
    }

    return NextResponse.json(response);
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

