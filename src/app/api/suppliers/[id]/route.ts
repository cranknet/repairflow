import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { emitEvent } from '@/lib/events/emitter';
import { nanoid } from 'nanoid';
import { t } from '@/lib/server-translation';

const updateSupplierSchema = z.object({
  name: z.string().min(1).optional(),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: t('errors.unauthorized') }, { status: 401 });
    }

    const { id } = await params;
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: { parts: true },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json({ error: t('errors.supplierNotFound') }, { status: 404 });
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return NextResponse.json(
      { error: t('errors.failedToFetch') },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const data = updateSupplierSchema.parse(body);

    // Check if supplier exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!existingSupplier) {
      return NextResponse.json({ error: t('errors.supplierNotFound') }, { status: 404 });
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.contactPerson !== undefined) updateData.contactPerson = data.contactPerson;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const updatedSupplier = await prisma.supplier.update({
      where: { id },
      data: updateData,
    });

    // Emit supplier.updated event
    emitEvent({
      eventId: nanoid(),
      entityType: 'supplier',
      entityId: updatedSupplier.id,
      action: 'updated',
      actorId: session.user.id,
      actorName: session.user.name || session.user.username,
      timestamp: new Date(),
      summary: `Supplier ${updatedSupplier.name} was updated`,
      meta: {
        supplierName: updatedSupplier.name,
      },
    });

    return NextResponse.json(updatedSupplier);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: t('errors.invalidInput'), details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating supplier:', error);
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

    // Only admins can delete suppliers
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: t('errors.onlyAdminsCanDelete') },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if supplier exists and has parts
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: { parts: true },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json({ error: t('errors.supplierNotFound') }, { status: 404 });
    }

    // Prevent deletion if supplier has parts
    if (supplier._count.parts > 0) {
      return NextResponse.json(
        { error: 'Cannot delete supplier with existing parts. Please update or remove parts first.' },
        { status: 400 }
      );
    }

    await prisma.supplier.delete({
      where: { id },
    });

    // Emit supplier.deleted event
    emitEvent({
      eventId: nanoid(),
      entityType: 'supplier',
      entityId: id,
      action: 'deleted',
      actorId: session.user.id,
      actorName: session.user.name || session.user.username,
      timestamp: new Date(),
      summary: `Supplier ${supplier.name} was deleted`,
      meta: {
        supplierName: supplier.name,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json(
      { error: t('errors.failedToDelete') },
      { status: 500 }
    );
  }
}


