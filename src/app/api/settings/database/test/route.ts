import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const config = await request.json();

        let databaseUrl = '';

        if (config.type === 'sqlite') {
            databaseUrl = 'file:./prisma/test.db';
        } else if (config.type === 'mysql') {
            const { host, port, database, user, password } = config;
            databaseUrl = `mysql://${user}:${password}@${host}:${port}/${database}`;
        }

        // Test the connection
        try {
            const prisma = new PrismaClient({
                datasourceUrl: databaseUrl,
            } as any);

            // Try a simple query
            await prisma.$connect();
            await prisma.$disconnect();

            return NextResponse.json({ success: true, message: 'Connection successful!' });
        } catch (error: any) {
            console.error('Database connection test failed:', error);
            return NextResponse.json({
                error: 'Connection failed: ' + (error.message || 'Unknown error')
            }, { status: 400 });
        }
    } catch (error) {
        console.error('Error testing database connection:', error);
        return NextResponse.json({ error: 'Failed to test connection' }, { status: 500 });
    }
}
