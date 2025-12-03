import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createPartSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  description: z.string().optional(),
  quantity: z.number().int().min(0).default(0),
  reorderLevel: z.number().int().min(0).default(5),
  unitPrice: z.number().min(0).default(0),
  supplierId: z.string().optional(),
  supplier: z.string().optional(), // Supplier name as fallback
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parts = await prisma.part.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        sku: true,
        unitPrice: true,
      },
    });

    return NextResponse.json(parts);
  } catch (error) {
    console.error('Error fetching parts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch parts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createPartSchema.parse(body);

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
          { error: 'Supplier not found' },
          { status: 404 }
        );
      }

      supplierName = supplier.name;
    }

    // Check if SKU already exists
    const existingPart = await prisma.part.findUnique({
      where: { sku: data.sku },
    });

    if (existingPart) {
      return NextResponse.json(
        { error: 'Part with this SKU already exists' },
        { status: 400 }
      );
    }

    // Create part
    const part = await prisma.part.create({
      data: {
        name: data.name,
        sku: data.sku,
        description: data.description,
        quantity: data.quantity,
        reorderLevel: data.reorderLevel,
        unitPrice: data.unitPrice,
        supplierId: supplierId,
        supplierName: supplierName, // Set supplier name for backwards compatibility
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(part, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating part:', error);
    return NextResponse.json(
      { error: 'Failed to create part' },
      { status: 500 }
    );
  }
}

