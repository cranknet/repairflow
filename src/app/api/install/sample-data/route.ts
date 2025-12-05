import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const sampleDataSchema = z.object({
    loadSampleData: z.boolean(),
});

/**
 * POST /api/install/sample-data
 * Load sample data during installation
 */
export async function POST(request: NextRequest) {
    try {
        // Check if already installed
        const isInstalled = await prisma.settings.findUnique({
            where: { key: 'is_installed' },
        });

        if (isInstalled?.value === 'true') {
            return NextResponse.json(
                { error: 'Application is already installed' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { loadSampleData } = sampleDataSchema.parse(body);

        if (!loadSampleData) {
            return NextResponse.json({ success: true, loaded: false });
        }

        // Create sample suppliers
        const suppliers = await Promise.all([
            prisma.supplier.create({
                data: {
                    name: 'TechParts Inc.',
                    phone: '+1 (555) 100-0001',
                    email: 'sales@techparts.example',
                    notes: 'Primary screen supplier.',
                },
            }),
            prisma.supplier.create({
                data: {
                    name: 'MobileSource',
                    phone: '+1 (555) 100-0002',
                    email: 'orders@mobilesource.example',
                },
            }),
            prisma.supplier.create({
                data: {
                    name: 'UnifiedParts',
                    phone: '+1 (555) 100-0003',
                },
            }),
        ]);

        // Create sample parts
        await Promise.all([
            prisma.part.create({
                data: {
                    name: 'iPhone 14 Screen Replacement',
                    sku: 'IPH14-SCR-001',
                    description: 'Original quality screen replacement for iPhone 14',
                    quantity: 15,
                    reorderLevel: 5,
                    unitPrice: 89.99,
                    supplierId: suppliers[0].id,
                    supplierName: suppliers[0].name,
                },
            }),
            prisma.part.create({
                data: {
                    name: 'Samsung A52 Screen',
                    sku: 'SMG-SCR-A52',
                    quantity: 8,
                    reorderLevel: 5,
                    unitPrice: 49.50,
                    supplierId: suppliers[1].id,
                    supplierName: suppliers[1].name,
                },
            }),
            prisma.part.create({
                data: {
                    name: 'Generic Battery 18650',
                    sku: 'GEN-BAT-18650',
                    quantity: 40,
                    reorderLevel: 10,
                    unitPrice: 7.20,
                    supplierId: suppliers[2].id,
                    supplierName: suppliers[2].name,
                },
            }),
            prisma.part.create({
                data: {
                    name: 'iPhone 13 Back Glass',
                    sku: 'IPH13-BGL-001',
                    description: 'Replacement back glass for iPhone 13',
                    quantity: 20,
                    reorderLevel: 5,
                    unitPrice: 35.00,
                    supplierId: suppliers[0].id,
                    supplierName: suppliers[0].name,
                },
            }),
            prisma.part.create({
                data: {
                    name: 'Camera Module iPhone 12',
                    sku: 'IPH12-CAM-001',
                    description: 'Rear camera module for iPhone 12',
                    quantity: 12,
                    reorderLevel: 5,
                    unitPrice: 75.00,
                    supplierId: suppliers[0].id,
                    supplierName: suppliers[0].name,
                },
            }),
        ]);

        // Create sample customers
        await Promise.all([
            prisma.customer.create({
                data: {
                    name: 'John Smith',
                    phone: '+1 (555) 123-4567',
                    email: 'john.smith@example.com',
                    address: '123 Oak Street, City, State 12345',
                    notes: 'Regular customer, prefers phone contact',
                },
            }),
            prisma.customer.create({
                data: {
                    name: 'Sarah Johnson',
                    phone: '+1 (555) 234-5678',
                    email: 'sarah.j@example.com',
                    address: '456 Pine Avenue, City, State 12345',
                },
            }),
            prisma.customer.create({
                data: {
                    name: 'Mike Davis',
                    phone: '+1 (555) 345-6789',
                    email: 'mike.davis@example.com',
                    address: '789 Elm Road, City, State 12345',
                    notes: 'Bulk repairs, corporate account',
                },
            }),
            prisma.customer.create({
                data: {
                    name: 'Emily Wilson',
                    phone: '+1 (555) 456-7890',
                    email: 'emily.w@example.com',
                },
            }),
            prisma.customer.create({
                data: {
                    name: 'Robert Brown',
                    phone: '+1 (555) 567-8901',
                    email: 'robert.brown@example.com',
                    address: '321 Maple Drive, City, State 12345',
                },
            }),
        ]);

        return NextResponse.json({
            success: true,
            loaded: true,
            counts: {
                suppliers: 3,
                parts: 5,
                customers: 5,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.errors },
                { status: 400 }
            );
        }
        console.error('Error loading sample data:', error);
        return NextResponse.json(
            { error: 'Failed to load sample data' },
            { status: 500 }
        );
    }
}
