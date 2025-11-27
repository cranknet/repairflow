import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createPartSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  quantity: z.number().int().min(0),
  reorderLevel: z.number().int().min(0),
  unitPrice: z.number().min(0),
  supplier: z.string().optional(),
});

// Function to generate SKU from part name
function generateSKU(name: string): string {
  // Take first 3-4 letters of each word, uppercase, join with dash
  const words = name.trim().split(/\s+/);
  const prefix = words
    .map((word) => word.substring(0, 3).toUpperCase())
    .join('-');
  
  // Add timestamp suffix to ensure uniqueness
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${timestamp}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get('filter');
    const search = searchParams.get('search');

    const where: any = {};
    if (filter === 'low_stock') {
      // This will be handled in the query
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { description: { contains: search } },
      ];
    }

    let parts;
    if (filter === 'low_stock') {
      // Get all parts and filter in memory for low stock
      parts = await prisma.part.findMany({
        where: search ? where : undefined,
        orderBy: { name: 'asc' },
      });
      parts = parts.filter((part) => part.quantity <= part.reorderLevel);
    } else {
      parts = await prisma.part.findMany({
        where,
        orderBy: { name: 'asc' },
      });
    }

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

    // Generate unique SKU
    let sku = generateSKU(data.name);
    let skuExists = true;
    let attempts = 0;
    
    // Ensure SKU is unique (in case of collision)
    while (skuExists && attempts < 10) {
      const existingPart = await prisma.part.findUnique({
        where: { sku },
      });
      
      if (!existingPart) {
        skuExists = false;
      } else {
        // Regenerate with different timestamp
        sku = generateSKU(data.name);
        attempts++;
      }
    }

    const part = await prisma.part.create({
      data: {
        ...data,
        sku,
      },
    });

    // Create initial inventory transaction
    if (data.quantity > 0) {
      await prisma.inventoryTransaction.create({
        data: {
          partId: part.id,
          type: 'IN',
          quantity: data.quantity,
          reason: 'Initial stock',
        },
      });
    }

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

