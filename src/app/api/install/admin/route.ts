import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { z } from 'zod';

// Admin creation schema (without confirmPassword - validated on client)
const createAdminSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(1, 'Name is required'),
});

/**
 * POST /api/install/admin
 * Create administrator account during installation
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

        // Check if any admin user already exists
        const existingAdmin = await prisma.user.findFirst({
            where: { role: 'ADMIN' },
        });

        if (existingAdmin) {
            return NextResponse.json(
                { error: 'An administrator account already exists' },
                { status: 409 }
            );
        }

        const body = await request.json();
        const data = createAdminSchema.parse(body);

        // Check for existing username or email
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: data.username },
                    { email: data.email },
                ],
            },
        });

        if (existingUser) {
            const field = existingUser.username === data.username ? 'username' : 'email';
            return NextResponse.json(
                { error: `A user with this ${field} already exists` },
                { status: 409 }
            );
        }

        // Hash password
        const hashedPassword = await hash(data.password, 10);

        // Create admin user
        const admin = await prisma.user.create({
            data: {
                username: data.username,
                email: data.email,
                password: hashedPassword,
                name: data.name,
                role: 'ADMIN',
            },
            select: {
                id: true,
                username: true,
                email: true,
                name: true,
                role: true,
            },
        });

        return NextResponse.json({
            success: true,
            admin,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.errors },
                { status: 400 }
            );
        }
        console.error('Error creating admin:', error);
        return NextResponse.json(
            { error: 'Failed to create administrator account' },
            { status: 500 }
        );
    }
}
