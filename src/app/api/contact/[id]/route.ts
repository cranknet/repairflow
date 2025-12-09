import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { t } from '@/lib/server-translation';

const updateMessageSchema = z.object({
  status: z.enum(['NEW', 'READ', 'ARCHIVED']).optional(),
  assignedToId: z.string().nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: t('errors.unauthorized') }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validationResult = updateMessageSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: t('errors.invalidInput') },
        { status: 400 }
      );
    }

    const { status, assignedToId } = validationResult.data;

    // Build update data
    const updateData: any = {};
    if (status !== undefined) {
      updateData.status = status;
    }
    if (assignedToId !== undefined) {
      // Validate user exists if assignedToId is provided
      if (assignedToId) {
        const user = await prisma.user.findUnique({
          where: { id: assignedToId },
          select: { id: true },
        });
        if (!user) {
          return NextResponse.json(
            { error: t('errors.userNotFound') },
            { status: 404 }
          );
        }
      }
      updateData.assignedToId = assignedToId;
    }

    // Update message
    const updatedMessage = await prisma.contactMessage.update({
      where: { id },
      data: updateData,
      include: {
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error('Error updating contact message:', error);
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: t('errors.messageNotFound') },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: t('errors.failedToUpdate') },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: t('errors.unauthorized') }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate assignedToId
    if (body.assignedToId !== null && body.assignedToId !== undefined) {
      const user = await prisma.user.findUnique({
        where: { id: body.assignedToId },
        select: { id: true },
      });
      if (!user) {
        return NextResponse.json(
          { error: t('errors.userNotFound') },
          { status: 404 }
        );
      }
    }

    // Update assignment
    const updatedMessage = await prisma.contactMessage.update({
      where: { id },
      data: {
        assignedToId: body.assignedToId || null,
      },
      include: {
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error('Error assigning contact message:', error);
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: t('errors.messageNotFound') },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: t('errors.failedToUpdate') },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: t('errors.unauthorized') }, { status: 401 });
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: t('errors.forbidden') }, { status: 403 });
    }

    const { id } = await params;

    // Delete message
    await prisma.contactMessage.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contact message:', error);
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { error: t('errors.messageNotFound') },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: t('errors.failedToDelete') },
      { status: 500 }
    );
  }
}

