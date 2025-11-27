import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updatePartSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  quantity: z.number().int().min(0).optional(),
  reorderLevel: z.number().int().min(0).optional(),
  unitPrice: z.number().min(0).optional(),
  supplier: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const part = await prisma.part.findUnique({
      where: { id },
      include: {
        inventoryTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!part) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 });
    }

    return NextResponse.json(part);
  } catch (error) {
    console.error('Error fetching part:', error);
    return NextResponse.json(
      { error: 'Failed to fetch part' },
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updatePartSchema.parse(body);

    // Check if part exists
    const existingPart = await prisma.part.findUnique({
      where: { id },
    });

    if (!existingPart) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 });
    }

    // If quantity is being changed, create a transaction
    if (data.quantity !== undefined && data.quantity !== existingPart.quantity) {
      const quantityDiff = data.quantity - existingPart.quantity;
      if (quantityDiff !== 0) {
        await prisma.inventoryTransaction.create({
          data: {
            partId: id,
            type: quantityDiff > 0 ? 'IN' : 'OUT',
            quantity: Math.abs(quantityDiff),
            reason: body.reason || 'Manual adjustment',
          },
        });
      }
    }

    // Update the part
    const updatedPart = await prisma.part.update({
      where: { id },
      data,
    });

    return NextResponse.json(updatedPart);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating part:', error);
    return NextResponse.json(
      { error: 'Failed to update part' },
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if part exists
    const existingPart = await prisma.part.findUnique({
      where: { id },
      include: {
        ticketParts: true,
        returnItems: true,
      },
    });

    if (!existingPart) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 });
    }

    // Check if part is used in any tickets or returns
    if (existingPart.ticketParts.length > 0 || existingPart.returnItems.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete part. It is being used in tickets or returns.',
          details: {
            ticketParts: existingPart.ticketParts.length,
            returnItems: existingPart.returnItems.length,
          }
        },
        { status: 400 }
      );
    }

    // Delete all inventory transactions first (cascade should handle this, but being explicit)
    await prisma.inventoryTransaction.deleteMany({
      where: { partId: id },
    });

    // Delete the part
    await prisma.part.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting part:', error);
    return NextResponse.json(
      { error: 'Failed to delete part' },
      { status: 500 }
    );
  }
}

