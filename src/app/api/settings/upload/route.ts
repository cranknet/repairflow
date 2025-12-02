import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'logo' or 'background'

    console.log('Upload request:', {
      hasFile: !!file,
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
      type
    });

    if (!file || !type) {
      console.error('Missing file or type:', { file: !!file, type });
      return NextResponse.json({ error: 'File and type are required' }, { status: 400 });
    }

    // SECURITY: Read file buffer for magic byte validation
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate file size BEFORE processing (max 5MB)
    if (buffer.length > 5 * 1024 * 1024) {
      console.error('File too large:', buffer.length);
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    // SECURITY: Validate actual file type using magic bytes (file-type package)
    // This prevents MIME type spoofing attacks
    const { fileTypeFromBuffer } = await import('file-type');
    const detectedType = await fileTypeFromBuffer(buffer);

    if (!detectedType) {
      return NextResponse.json({ error: 'Unable to determine file type' }, { status: 400 });
    }

    // SECURITY: Only allow safe image formats - SVG BLOCKED due to XSS risk
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    if (!allowedMimeTypes.includes(detectedType.mime)) {
      console.error('Invalid file type detected:', detectedType.mime, 'Claimed:', file.type);
      return NextResponse.json({
        error: `Invalid file type: ${detectedType.mime}. Only JPEG, PNG, GIF, and WebP images are allowed. SVG is blocked for security.`
      }, { status: 400 });
    }

    if (!allowedExtensions.includes(detectedType.ext)) {
      return NextResponse.json({
        error: `Invalid file extension: ${detectedType.ext}`
      }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename using validated extension
    const timestamp = Date.now();
    const filename = `${type}-${timestamp}.${detectedType.ext}`;
    const filepath = join(uploadsDir, filename);

    // Save validated file buffer
    await writeFile(filepath, buffer);

    // Save file path to settings
    let settingKey = 'login_background_image';
    let description = 'Login page background image';

    if (type === 'logo') {
      settingKey = 'company_logo';
      description = 'Company logo';
    } else if (type === 'favicon') {
      settingKey = 'company_favicon';
      description = 'Company favicon';
    } else if (type === 'track_image') {
      settingKey = 'default_track_image';
      description = 'Default track page background image';
    }

    const fileUrl = `/uploads/${filename}`;

    await prisma.settings.upsert({
      where: { key: settingKey },
      update: { value: fileUrl },
      create: {
        key: settingKey,
        value: fileUrl,
        description: description,
      },
    });

    return NextResponse.json({ url: fileUrl, success: true });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

