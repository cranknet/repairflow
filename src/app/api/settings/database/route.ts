import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Read current configuration
        const databaseUrl = process.env.DATABASE_URL || '';

        let config: any = {
            type: 'sqlite' as 'sqlite' | 'mysql',
        };

        if (databaseUrl.startsWith('mysql://')) {
            // Parse MySQL URL
            const url = new URL(databaseUrl);
            config = {
                type: 'mysql',
                host: url.hostname,
                port: parseInt(url.port) || 3306,
                database: url.pathname.slice(1),
                user: url.username,
                password: '', // Don't send password to client
            };
        }

        return NextResponse.json(config);
    } catch (error) {
        console.error('Error loading database config:', error);
        return NextResponse.json({ error: 'Failed to load configuration' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const config = await request.json();

        let newDatabaseUrl = '';

        if (config.type === 'sqlite') {
            // Use default SQLite configuration
            if (typeof window !== 'undefined' && (window as any).electron) {
                // In Electron, use user data directory
                newDatabaseUrl = 'file:./prisma/repairflow.db';
            } else {
                newDatabaseUrl = 'file:./prisma/dev.db';
            }
        } else if (config.type === 'mysql') {
            // Build MySQL URL
            const { host, port, database, user, password } = config;
            newDatabaseUrl = `mysql://${user}:${password}@${host}:${port}/${database}`;
        }

        // In Electron, we can update the .env file
        // For web, this would require manual .env update
        if (process.env.ELECTRON_ENV) {
            const envPath = path.join(process.cwd(), '.env');
            let envContent = '';

            if (fs.existsSync(envPath)) {
                envContent = fs.readFileSync(envPath, 'utf-8');
            }

            // Update DATABASE_URL in .env
            const lines = envContent.split('\n');
            let found = false;

            for (let i = 0; i < lines.length; i++) {
                if (lines[i].startsWith('DATABASE_URL=')) {
                    lines[i] = `DATABASE_URL="${newDatabaseUrl}"`;
                    found = true;
                    break;
                }
            }

            if (!found) {
                lines.push(`DATABASE_URL="${newDatabaseUrl}"`);
            }

            fs.writeFileSync(envPath, lines.join('\n'));
        }

        return NextResponse.json({ success: true, message: 'Configuration saved. Please restart the application.' });
    } catch (error) {
        console.error('Error saving database config:', error);
        return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
    }
}
