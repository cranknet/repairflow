import nodemailer from 'nodemailer';
import { getPasswordResetEmailTemplate, type PasswordResetEmailData } from './email-templates/password-reset';
import { getPasswordChangedEmailTemplate, type PasswordChangedEmailData } from './email-templates/password-changed';
import { prisma } from './prisma';
import { decrypt } from './encryption';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
  fromName: string;
  replyTo?: string;
}

/**
 * Get email configuration from database or environment variables
 * Priority: 1. Database (if active), 2. Environment variables
 */
async function getEmailConfig(): Promise<EmailConfig | null> {
  try {
    // Try to get active settings from database
    const settings = await prisma.emailSettings.findFirst({
      where: { isActive: true }
    });

    if (settings) {
      return {
        host: settings.smtpHost,
        port: settings.smtpPort,
        secure: settings.smtpSecure,
        user: settings.smtpUser,
        password: decrypt(settings.smtpPassword),
        from: settings.fromEmail,
        fromName: settings.fromName,
        replyTo: settings.replyToEmail || undefined
      };
    }
  } catch (error) {
    console.warn('Could not fetch email settings from database:', error);
  }

  // Fallback to environment variables
  if (process.env.SMTP_USER && (process.env.SMTP_PASS || process.env.SMTP_PASSWORD)) {
    return {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true' || false,
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD || process.env.SMTP_PASS || '',
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      fromName: process.env.SMTP_FROM_NAME || 'RepairFlow'
    };
  }

  return null;
}

/**
 * Create nodemailer transporter with configuration
 */
async function createTransporter(config: EmailConfig) {
  // Port 587 typically uses STARTTLS (secure: false, requireTLS: true)
  // Port 465 uses implicit TLS (secure: true)
  const useSTARTTLS = config.port === 587 || (config.port !== 465 && config.secure);

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465, // true for 465, false for other ports
    requireTLS: useSTARTTLS, // Require TLS for port 587
    auth: {
      user: config.user,
      pass: config.password
    },
    tls: {
      // Don't fail on invalid certificates in development
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
  });
}


/**
 * Send an email using configured SMTP settings
 */
export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}) {
  const config = await getEmailConfig();

  if (!config) {
    console.warn('Email not configured. Please configure SMTP settings in Settings > Email or set environment variables.');
    throw new Error('Email service is not configured');
  }

  try {
    const transporter = await createTransporter(config);

    await transporter.sendMail({
      from: `"${config.fromName}" <${config.from}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      text: html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      replyTo: replyTo || config.replyTo
    });
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Test SMTP connection with given configuration
 */
export async function testSMTPConnection(config: EmailConfig): Promise<boolean> {
  try {
    const transporter = await createTransporter(config);
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('SMTP connection test failed:', error);
    return false;
  }
}

/**
 * Send password reset email with template
 */
export async function sendPasswordResetEmail(
  email: string,
  resetLink: string,
  userName: string
): Promise<void> {
  // Get company name from settings
  let companyName = 'RepairFlow';
  try {
    const companyNameSetting = await prisma.settings.findUnique({
      where: { key: 'COMPANY_NAME' },
    });
    if (companyNameSetting) {
      companyName = companyNameSetting.value;
    }
  } catch (error) {
    console.warn('Could not fetch company name from settings:', error);
  }

  const emailData: PasswordResetEmailData = {
    name: userName,
    resetLink,
    expiryTime: '1 hour',
    companyName,
  };

  const html = getPasswordResetEmailTemplate(emailData);
  const subject = `Reset Your Password - ${companyName}`;

  await sendEmail({
    to: email,
    subject,
    html,
  });
}

/**
 * Send password changed confirmation email
 */
export async function sendPasswordChangedConfirmation(
  email: string,
  userName: string
): Promise<void> {
  // Get company name and support contact from settings
  let companyName = 'RepairFlow';
  let supportContact: string | undefined;

  try {
    const [companyNameSetting, supportSetting] = await Promise.all([
      prisma.settings.findUnique({ where: { key: 'COMPANY_NAME' } }),
      prisma.settings.findUnique({ where: { key: 'COMPANY_EMAIL' } }),
    ]);

    if (companyNameSetting) {
      companyName = companyNameSetting.value;
    }
    if (supportSetting) {
      supportContact = supportSetting.value;
    }
  } catch (error) {
    console.warn('Could not fetch settings for email:', error);
  }

  const emailData: PasswordChangedEmailData = {
    name: userName,
    timestamp: new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }),
    companyName,
    supportContact,
  };

  const html = getPasswordChangedEmailTemplate(emailData);
  const subject = `Password Changed Successfully - ${companyName}`;

  await sendEmail({
    to: email,
    subject,
    html,
  });
}

