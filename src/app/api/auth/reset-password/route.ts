import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { authRateLimiters } from '@/lib/rate-limit';
import { sendPasswordChangedConfirmation } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (5 attempts per IP per hour)
    const clientId = authRateLimiters.resetPassword.getClientId(request);
    const rateLimit = authRateLimiters.resetPassword.check(clientId);

    if (!rateLimit.allowed) {
      const remainingSeconds = Math.ceil((rateLimit.resetAt! - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: 'Too many password reset attempts. Please try again later.',
          retryAfter: remainingSeconds
        },
        {
          status: 429,
          headers: {
            'Retry-After': remainingSeconds.toString(),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimit.resetAt!).toISOString(),
          }
        }
      );
    }

    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    // Enhanced password validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check password complexity
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return NextResponse.json(
        { error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' },
        { status: 400 }
      );
    }

    // Find reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        { error: 'Reset token has expired' },
        { status: 400 }
      );
    }

    // Check if token has been used
    if (resetToken.used) {
      return NextResponse.json(
        { error: 'Reset token has already been used' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get user info for confirmation email
    const user = await prisma.user.findUnique({
      where: { id: resetToken.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    // Send password changed confirmation email
    try {
      await sendPasswordChangedConfirmation(
        user.email,
        user.name || user.username
      );
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}

