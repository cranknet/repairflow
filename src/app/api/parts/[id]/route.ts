import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { emitEvent } from '@/lib/events/emitter';
import { nanoid } from 'nanoid';
import { t } from '@/lib/server-translation';

const updatePartSchema = z.object({
  name: z.string().min(1).optional(),
  sku: z.string().min(1).optional(),
  description: z.string().optional(),
  quantity: z.number().int().min(0).optional(),
  reorderLevel: z.number().int().min(0).optional(),
  unitPrice: z.number().min(0).optional(),
  supplierId: z.string().optional(),
  supplier: z.string().optional(), // Supplier name as fallback
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: t('errors.unauthorized') }, { status: 401 });
    }

    // Only admins can update parts
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: t('errors.onlyAdminsCanUpdate') },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const data = updatePartSchema.parse(body);

    // Check if part exists
    const existingPart = await prisma.part.findUnique({
      where: { id },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!existingPart) {
      return NextResponse.json({ error: t('errors.partNotFound') }, { status: 404 });
    }

    // Check if SKU is being changed and if new SKU already exists
    if (data.sku && data.sku !== existingPart.sku) {
      const skuExists = await prisma.part.findUnique({
        where: { sku: data.sku },
      });

      if (skuExists) {
        return NextResponse.json(
          { error: t('errors.skuAlreadyExists') },
          { status: 400 }
        );
      }
    }

    // Handle supplier: if supplierId provided, use it; if supplier name provided, find or create
    let supplierId: string | undefined = data.supplierId;
    let supplierName: string | undefined = data.supplier;

    if (!supplierId && data.supplier) {
      // Find existing supplier by name, or create new one
      let supplier = await prisma.supplier.findFirst({
        where: { name: data.supplier.trim() },
      });

      if (!supplier) {
        // Create new supplier
        supplier = await prisma.supplier.create({
          data: {
            name: data.supplier.trim(),
          },
        });
      }

      supplierId = supplier.id;
      supplierName = supplier.name;
    } else if (supplierId) {
      // Validate supplier exists
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
      });

      if (!supplier) {
        return NextResponse.json(
          { error: t('errors.supplierNotFound') },
          { status: 404 }
        );
      }

      supplierName = supplier.name;
    }

    // Build update data
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.reorderLevel !== undefined) updateData.reorderLevel = data.reorderLevel;
    if (data.unitPrice !== undefined) updateData.unitPrice = data.unitPrice;
    if (supplierId !== undefined) updateData.supplierId = supplierId || null;
    
    // Set supplierName for backwards compatibility
    if (supplierName !== undefined) {
      updateData.supplierName = supplierName || null;
    }

    const updatedPart = await prisma.part.update({
      where: { id },
      data: updateData,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Emit part.updated event
    emitEvent({
      eventId: nanoid(),
      entityType: 'part',
      entityId: updatedPart.id,
      action: 'updated',
      actorId: session.user.id,
      actorName: session.user.name || session.user.username,
      timestamp: new Date(),
      summary: `Part ${updatedPart.name} was updated`,
      meta: {
        partName: updatedPart.name,
        partSku: updatedPart.sku,
      },
    });

    return NextResponse.json(updatedPart);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: t('errors.invalidInput'), details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating part:', error);
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

    // Only admins can delete parts
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: t('errors.onlyAdminsCanDelete') },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if part exists and has related records
    const part = await prisma.part.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            ticketParts: true,
            expenses: true,
            inventoryAdjustments: true,
          },
        },
      },
    });

    if (!part) {
      return NextResponse.json({ error: t('errors.partNotFound') }, { status: 404 });
    }

    // Prevent deletion if part is used in tickets
    if (part._count.ticketParts > 0) {
      return NextResponse.json(
        { error: 'Cannot delete part that is used in tickets. Please remove the part from tickets first.' },
        { status: 400 }
      );
    }

    // Delete the part (expenses and inventory adjustments will be handled by their onDelete settings)
    await prisma.part.delete({
      where: { id },
    });

    // Emit part.deleted event
    emitEvent({
      eventId: nanoid(),
      entityType: 'part',
      entityId: id,
      action: 'deleted',
      actorId: session.user.id,
      actorName: session.user.name || session.user.username,
      timestamp: new Date(),
      summary: `Part ${part.name} was deleted`,
      meta: {
        partName: part.name,
        partSku: part.sku,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting part:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      // Check for foreign key constraint errors
      if (error.message.includes('Foreign key constraint') || error.message.includes('constraint')) {
        return NextResponse.json(
          { error: t('errors.invalidInput') },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: t('errors.failedToDelete') },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: t('errors.failedToDelete') },
      { status: 500 }
    );
  }
}

