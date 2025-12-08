/**
 * Route Handler for serving uploaded files
 * This handler serves files from /public/uploads/ ensuring they are accessible
 * even if added at runtime (which static serving might miss in some environments).
 */
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

export const runtime = 'nodejs';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ filename: string }> }
) {
    const params = await props.params;
    const { filename } = params;

    // Basic security to prevent directory traversal
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return new NextResponse('Invalid filename', { status: 400 });
    }

    // Look for the file in public/uploads
    const filePath = join(process.cwd(), 'public', 'uploads', filename);

    if (!existsSync(filePath)) {
        return new NextResponse('File not found', { status: 404 });
    }

    try {
        const fileBuffer = await readFile(filePath);
        const ext = filename.split('.').pop()?.toLowerCase();

        let contentType = 'application/octet-stream';
        switch (ext) {
            case 'png': contentType = 'image/png'; break;
            case 'jpg':
            case 'jpeg': contentType = 'image/jpeg'; break;
            case 'gif': contentType = 'image/gif'; break;
            case 'webp': contentType = 'image/webp'; break;
            case 'svg': contentType = 'image/svg+xml'; break;
        }

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                // Cache for 1 year, as uploads are usually immutable by name (timestamped)
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('Error serving upload:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
