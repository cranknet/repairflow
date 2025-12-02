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

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      console.error('Invalid file type:', file.type, 'Valid types:', validTypes);
      return NextResponse.json({ error: `Invalid file type: ${file.type}. Allowed types: ${validTypes.join(', ')}` }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.error('File too large:', file.size);
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `${type}-${timestamp}.${extension}`;
    const filepath = join(uploadsDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
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

