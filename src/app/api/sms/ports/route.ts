import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { COMPortSMS } from '@/lib/com-port-sms';

export const runtime = 'nodejs'; // Required for serialport native module

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN and STAFF can access SMS features
    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ports = await COMPortSMS.listPorts();
    return NextResponse.json(ports);
  } catch (error) {
    console.error('Error listing COM ports:', error);
    return NextResponse.json(
      { error: 'Failed to list COM ports' },
      { status: 500 }
    );
  }
}

