import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email';
import { authRateLimiters } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (3 requests per IP per hour)
    const clientId = authRateLimiters.forgotPassword.getClientId(request);
    const rateLimit = authRateLimiters.forgotPassword.check(clientId);

    if (!rateLimit.allowed) {
      const remainingSeconds = Math.ceil((rateLimit.resetAt! - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: 'Too many password reset requests. Please try again later.',
          retryAfter: remainingSeconds
        },
        {
          status: 429,
          headers: {
            'Retry-After': remainingSeconds.toString(),
            'X-RateLimit-Limit': '3',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimit.resetAt!).toISOString(),
          }
        }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find user by email or username (if email is used as username)
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username: email }],
      },
    });

    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      // Still return success to prevent email enumeration
      return NextResponse.json({
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    // Generate secure random token using crypto.randomBytes
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    // Delete any existing reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Create new reset token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send reset email using template
    const resetUrl = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    try {
      await sendPasswordResetEmail(
        user.email,
        resetUrl,
        user.name || user.username
      );
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Still return success to prevent revealing email issues
    }

    return NextResponse.json({
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Error in forgot password:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}

