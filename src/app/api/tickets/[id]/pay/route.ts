import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createNotification } from '@/lib/notifications';

const createPaymentSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  method: z.enum(['cash', 'card', 'mobile', 'other']),
  reference: z.string().optional(),
  reason: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission (ADMIN or STAFF only)
    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
      return NextResponse.json(
        { error: 'Only admin or staff can record payments' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const data = createPaymentSchema.parse(body);

    // Fetch ticket with payments
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        payments: {
          select: {
            amount: true,
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Validate ticket status is REPAIRED
    if (ticket.status !== 'REPAIRED') {
      return NextResponse.json(
        { error: 'Only repaired tickets can be paid' },
        { status: 400 }
      );
    }

    // Calculate outstanding amount
    const totalPaid = ticket.payments.reduce((sum, p) => sum + p.amount, 0);
    const finalPrice = ticket.finalPrice ?? ticket.estimatedPrice;
    const outstandingAmount = finalPrice - totalPaid;

    // Validate amount doesn't exceed outstanding + small tolerance (0.01 for rounding)
    if (data.amount > outstandingAmount + 0.01) {
      return NextResponse.json(
        { error: 'Amount cannot exceed outstanding amount' },
        { status: 400 }
      );
    }

    // Validate reason is provided if amount differs from outstanding
    const amountDiffers = Math.abs(data.amount - outstandingAmount) > 0.01;
    if (amountDiffers && (!data.reason || data.reason.trim().length < 5)) {
      return NextResponse.json(
        { error: 'Reason is required when amount differs from outstanding (minimum 5 characters)' },
        { status: 400 }
      );
    }

    // Verify the user exists before creating payment
    // This prevents foreign key constraint violations
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { 
          error: 'Authentication error', 
          details: 'Your user account is no longer valid. Please log out and log in again.' 
        },
        { status: 401 }
      );
    }

    // Calculate new total paid
    const newTotalPaid = totalPaid + data.amount;
    const isFullyPaid = newTotalPaid >= finalPrice - 0.01; // Small tolerance for rounding

    // Use a transaction to ensure both payment creation and ticket update succeed together
    const result = await prisma.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.payment.create({
        data: {
          ticketId: ticket.id,
          amount: data.amount,
          method: data.method,
          reference: data.reference?.trim() || null,
          reason: data.reason?.trim() || null,
          performedBy: session.user.id,
        },
        include: {
          performedByUser: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      });

      // Update ticket paid status if fully paid
      if (isFullyPaid && !ticket.paid) {
        await tx.ticket.update({
          where: { id },
          data: { paid: true },
        });
      }

      return payment;
    });

    // Add status history entry
    await prisma.ticketStatusHistory.create({
      data: {
        ticketId: ticket.id,
        status: ticket.status, // Keep REPAIRED
        notes: `Payment recorded: ${data.amount} via ${data.method}${data.reference ? ` (Ref: ${data.reference})` : ''}${data.reason ? `. Reason: ${data.reason}` : ''}. Total paid: ${newTotalPaid.toFixed(2)}/${finalPrice.toFixed(2)}`,
      },
    });

    // Create notification
    const paymentMessage = `Payment of ${data.amount} recorded for ticket ${ticket.ticketNumber} via ${data.method}`;
    await createNotification({
      type: 'PAYMENT_STATUS_CHANGE',
      message: paymentMessage,
      userId: ticket.assignedToId || null,
      ticketId: ticket.id,
    });

    // Fetch updated ticket with all payments (use the payment from transaction)
    const updatedTicket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        customer: true,
        assignedTo: true,
        payments: {
          include: {
            performedByUser: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return NextResponse.json(updatedTicket, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating payment:', error);
    
    // Handle Prisma foreign key errors
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      const meta = (error as any).meta;
      console.error('Foreign key constraint violation:', meta);
      
      // If it's a user foreign key issue, suggest re-login
      if (meta?.field_name === 'performedBy' || meta?.field_name?.includes('User')) {
        return NextResponse.json(
          { 
            error: 'Authentication error', 
            details: 'Your session may be invalid. Please log out and log in again.' 
          },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Foreign key constraint violation', 
          details: `The referenced record does not exist. Field: ${meta?.field_name || 'unknown'}` 
        },
        { status: 400 }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to record payment', details: errorMessage },
      { status: 500 }
    );
  }
}

