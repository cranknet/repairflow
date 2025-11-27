import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createTemplateSchema = z.object({
  name: z.string().min(1),
  templateId: z.string().min(1),
  language: z.enum(['en', 'ar', 'fr']),
  message: z.string().min(1),
  variables: z.array(z.string()),
  isActive: z.boolean().default(true),
});

const updateTemplateSchema = createTemplateSchema.partial();

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const language = searchParams.get('language');
    const templateId = searchParams.get('templateId');

    const where: any = {};
    if (language) {
      where.language = language;
    }
    if (templateId) {
      where.templateId = templateId;
    }

    const templates = await prisma.sMSTemplate.findMany({
      where,
      orderBy: [{ templateId: 'asc' }, { language: 'asc' }],
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching SMS templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SMS templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createTemplateSchema.parse(body);

    const template = await prisma.sMSTemplate.create({
      data: {
        ...data,
        variables: JSON.stringify(data.variables),
      },
    });

    return NextResponse.json({
      ...template,
      variables: JSON.parse(template.variables),
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating SMS template:', error);
    return NextResponse.json(
      { error: 'Failed to create SMS template' },
      { status: 500 }
    );
  }
}

