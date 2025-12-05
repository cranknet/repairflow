import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

/**
 * POST /api/install/branding
 * Handle branding uploads during installation
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

        const formData = await request.formData();
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');

        // Ensure upload directory exists
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        const savedFiles: Record<string, string> = {};

        // Process logo
        const logo = formData.get('logo') as File | null;
        if (logo && logo.size > 0) {
            const logoBuffer = Buffer.from(await logo.arrayBuffer());
            const logoExt = logo.name.split('.').pop() || 'png';
            const logoFilename = `logo-${Date.now()}.${logoExt}`;
            const logoPath = path.join(uploadDir, logoFilename);
            await writeFile(logoPath, logoBuffer);
            savedFiles.company_logo = `/uploads/${logoFilename}`;
        }

        // Process favicon
        const favicon = formData.get('favicon') as File | null;
        if (favicon && favicon.size > 0) {
            const faviconBuffer = Buffer.from(await favicon.arrayBuffer());
            const faviconExt = favicon.name.split('.').pop() || 'png';
            const faviconFilename = `favicon-${Date.now()}.${faviconExt}`;
            const faviconPath = path.join(uploadDir, faviconFilename);
            await writeFile(faviconPath, faviconBuffer);
            savedFiles.company_favicon = `/uploads/${faviconFilename}`;
        }

        // Process login background
        const loginBackground = formData.get('loginBackground') as File | null;
        if (loginBackground && loginBackground.size > 0) {
            const bgBuffer = Buffer.from(await loginBackground.arrayBuffer());
            const bgExt = loginBackground.name.split('.').pop() || 'jpg';
            const bgFilename = `login-bg-${Date.now()}.${bgExt}`;
            const bgPath = path.join(uploadDir, bgFilename);
            await writeFile(bgPath, bgBuffer);
            savedFiles.login_background_image = `/uploads/${bgFilename}`;
        }

        // Save settings to database
        if (Object.keys(savedFiles).length > 0) {
            await prisma.$transaction(
                Object.entries(savedFiles).map(([key, value]) =>
                    prisma.settings.upsert({
                        where: { key },
                        update: { value },
                        create: {
                            key,
                            value,
                            description: `Branding: ${key}`,
                        },
                    })
                )
            );
        }

        return NextResponse.json({
            success: true,
            files: savedFiles,
        });
    } catch (error) {
        console.error('Error saving branding:', error);
        return NextResponse.json(
            { error: 'Failed to save branding' },
            { status: 500 }
        );
    }
}
