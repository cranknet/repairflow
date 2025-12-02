import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json({ valid: false });
    }

    // Check if token is expired
    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json({ valid: false });
    }

    // Check if token has been used
    if (resetToken.used) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({ valid: true, userId: resetToken.userId });
  } catch (error) {
    console.error('Error validating reset token:', error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}

