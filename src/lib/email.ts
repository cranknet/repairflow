import nodemailer from 'nodemailer';
import { getPasswordResetEmailTemplate, type PasswordResetEmailData } from './email-templates/password-reset';
import { getPasswordChangedEmailTemplate, type PasswordChangedEmailData } from './email-templates/password-changed';
import { prisma } from './prisma';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP credentials not configured. Email not sent.');
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
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

