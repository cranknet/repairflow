import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getInventorySettings } from '@/lib/settings';

const createPartSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  description: z.string().optional(),
  quantity: z.number().int().min(0).default(0),
  reorderLevel: z.number().int().min(0).optional(),
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

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const supplierId = searchParams.get('supplierId');

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    const parts = await prisma.part.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: 'asc' },
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

    // Get inventory settings
    const inventorySettings = await getInventorySettings();

    // Check if supplier is required
    if (inventorySettings.requireSupplier) {
      if (!data.supplierId && !data.supplier) {
        return NextResponse.json(
          { error: 'Supplier is required for all parts' },
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

    // Use default reorder level from settings if not provided
    const reorderLevel = data.reorderLevel ?? inventorySettings.defaultReorderLevel;

    // Create part
    const createData: any = {
      name: data.name,
      sku: data.sku,
      description: data.description,
      quantity: data.quantity,
      reorderLevel,
      unitPrice: data.unitPrice,
      supplierId: supplierId || undefined,
    };

    // Set supplierName for backwards compatibility (mapped from "supplier" column)
    if (supplierName) {
      createData.supplierName = supplierName;
    }

    const part = await prisma.part.create({
      data: createData,
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

