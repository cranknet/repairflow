import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { COMPortSMS } from '@/lib/com-port-sms';
import { formatSMSTemplate, DEFAULT_SMS_TEMPLATES } from '@/lib/sms-templates';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const runtime = 'nodejs'; // Required for serialport native module

const sendSMSSchema = z.object({
  portPath: z.string().min(1),
  phoneNumber: z.string().min(1),
  templateId: z.string().optional(),
  message: z.string().min(1),
  data: z.record(z.string()).optional(),
  language: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN and STAFF can send SMS
    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { portPath, phoneNumber, templateId, message, data, language = 'en' } = sendSMSSchema.parse(body);

    let finalMessage = message;

    // If template is provided, format it
    if (templateId && templateId !== 'custom') {
      // Try to fetch from database first
      let template = null;
      try {
        const dbTemplate = await prisma.sMSTemplate.findFirst({
          where: {
            templateId,
            language,
            isActive: true,
          },
        });
        if (dbTemplate) {
          template = {
            id: dbTemplate.id,
            name: dbTemplate.name,
            message: dbTemplate.message,
            variables: JSON.parse(dbTemplate.variables),
          };
        }
      } catch (error) {
        console.error('Error fetching template from database:', error);
      }

      // Fallback to default templates
      if (!template) {
        template = DEFAULT_SMS_TEMPLATES.find((t) => t.id === templateId || t.templateId === templateId);
      }

      if (template && data) {
        finalMessage = formatSMSTemplate(template, data);
      }
    }

    // Connect to COM port and send SMS via AT commands
    const smsHandler = new COMPortSMS();
    try {
      await smsHandler.connect(portPath, 9600);
      await smsHandler.sendSMS(phoneNumber, finalMessage);
      await smsHandler.disconnect();

      return NextResponse.json({
        success: true,
        message: 'SMS sent successfully',
      });
    } catch (error: any) {
      await smsHandler.disconnect().catch(() => {});
      throw error;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error sending SMS:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send SMS' },
      { status: 500 }
    );
  }
}

