import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  templateId: z.string().min(1).optional(),
  language: z.enum(['en', 'ar', 'fr']).optional(),
  message: z.string().min(1).optional(),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const template = await prisma.sMSTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...template,
      variables: JSON.parse(template.variables),
    });
  } catch (error) {
    console.error('Error fetching SMS template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SMS template' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateTemplateSchema.parse(body);

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.templateId !== undefined) updateData.templateId = data.templateId;
    if (data.language !== undefined) updateData.language = data.language;
    if (data.message !== undefined) updateData.message = data.message;
    if (data.variables !== undefined) updateData.variables = JSON.stringify(data.variables);
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const template = await prisma.sMSTemplate.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      ...template,
      variables: JSON.parse(template.variables),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating SMS template:', error);
    return NextResponse.json(
      { error: 'Failed to update SMS template' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.sMSTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting SMS template:', error);
    return NextResponse.json(
      { error: 'Failed to delete SMS template' },
      { status: 500 }
    );
  }
}

