import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Simple in-memory rate limiting (for production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 1; // 1 message per minute

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

const contactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  phone: z.string().max(50).optional(),
  message: z.string().min(1).max(5000),
  ticketId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check rate limiting
    const clientId = getClientId(request);
    const rateLimit = checkRateLimit(clientId);
    
    if (!rateLimit.allowed) {
      const remainingSeconds = Math.ceil((rateLimit.resetAt! - Date.now()) / 1000);
      return NextResponse.json(
        { 
          error: 'Too many messages. Please wait before sending another.',
          rateLimitExceeded: true,
          retryAfter: remainingSeconds
        },
        { 
          status: 429,
          headers: {
            'Retry-After': remainingSeconds.toString(),
          }
        }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = contactSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input. Please check your form data.' },
        { status: 400 }
      );
    }

    const { name, email, phone, message, ticketId } = validationResult.data;

    // Sanitize inputs
    const sanitizedName = name.trim();
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedPhone = phone?.trim() || null;
    const sanitizedMessage = message.trim();

    // Validate ticketId if provided
    let validTicketId: string | null = null;
    if (ticketId) {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { id: true },
      });
      if (ticket) {
        validTicketId = ticket.id;
      }
      // If ticket doesn't exist, we just ignore it (don't fail the request)
    }

    // Create contact message
    const contactMessage = await prisma.contactMessage.create({
      data: {
        name: sanitizedName,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        message: sanitizedMessage,
        ticketId: validTicketId,
        status: 'NEW',
      },
    });

    return NextResponse.json(
      { 
        success: true,
        message: 'Message sent successfully! We\'ll get back to you soon.',
        id: contactMessage.id
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating contact message:', error);
    return NextResponse.json(
      { error: 'Failed to send message. Please try again.' },
      { status: 500 }
    );
  }
}

