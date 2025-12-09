import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { createNotification } from '@/lib/notifications';
import { t } from '@/lib/server-translation';

const updateUserSchema = z.object({
  username: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(6).optional(),
  name: z.string().optional(),
  role: z.enum(['ADMIN', 'STAFF']).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: t('errors.unauthorized') }, { status: 401 });
    }

    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: t('errors.userNotFound') }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: t('errors.failedToFetch') },
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
    if (!session) {
      return NextResponse.json({ error: t('errors.unauthorized') }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateUserSchema.parse(body);

    // Allow users to update their own profile, or admins to update any profile
    if (session.user.id !== id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: t('errors.forbidden') }, { status: 403 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: t('errors.userNotFound') }, { status: 404 });
    }

    // If username is being changed, check if new username already exists
    if (data.username && data.username !== existingUser.username) {
      const usernameExists = await prisma.user.findUnique({
        where: { username: data.username },
      });

      if (usernameExists) {
        return NextResponse.json(
          { error: 'Username already exists' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};

    // Allow users to change their own username, but only admins can change others' usernames
    if (data.username) {
      if (session.user.id === id || session.user.role === 'ADMIN') {
        updateData.username = data.username;
      }
    }

    // Only admins can change roles
    if (data.role && session.user.role === 'ADMIN') {
      updateData.role = data.role;
    }

    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.name !== undefined) updateData.name = data.name || null;
    if (data.password) {
      // If changing password, verify current password first
      if (body.currentPassword) {
        const isValid = await bcrypt.compare(body.currentPassword, existingUser.password);
        if (!isValid) {
          return NextResponse.json(
            { error: 'Current password is incorrect' },
            { status: 400 }
          );
        }
      }
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        name: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: t('errors.invalidInput'), details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating user:', error);
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
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: t('errors.unauthorized') }, { status: 401 });
    }

    const { id } = await params;

    // Prevent deleting own account
    if (id === session.user.id) {
      return NextResponse.json(
        { error: t('errors.invalidInput') },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: t('errors.userNotFound') }, { status: 404 });
    }

    const deletedUsername = existingUser.username;

    await prisma.user.delete({
      where: { id },
    });

    // Create notification for all admins about user deletion
    await createNotification({
      type: 'USER_DELETED',
      message: `User "${deletedUsername}" has been deleted by ${session.user.username || session.user.name || 'Admin'}`,
      userId: null, // Notify all admins
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: t('errors.failedToDelete') },
      { status: 500 }
    );
  }
}

