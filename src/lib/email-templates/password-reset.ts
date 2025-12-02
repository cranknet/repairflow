export interface PasswordResetEmailData {
  name: string;
  resetLink: string;
  expiryTime: string;
  companyName: string;
}

export function getPasswordResetEmailTemplate(data: PasswordResetEmailData): string {
  const { name, resetLink, expiryTime, companyName } = data;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Request</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">${companyName}</h1>
  </div>
  
  <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
    
    <p>Hello ${name},</p>
    
    <p>We received a request to reset your password. Click the button below to reset it:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}" 
         style="background-color: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
        Reset Password
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #4F46E5; font-size: 12px; background: #f5f5f5; padding: 10px; border-radius: 4px;">${resetLink}</p>
    
    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #856404; font-size: 14px;">
        <strong>⏰ Important:</strong> This link will expire in ${expiryTime}.
      </p>
    </div>
    
    <div style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #721c24; font-size: 14px;">
        <strong>🔒 Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
      </p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;" />
    
    <p style="color: #666; font-size: 12px; margin: 0;">
      Best regards,<br />
      The ${companyName} Team
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>This is an automated message. Please do not reply to this email.</p>
  </div>
</body>
</html>
  `.trim();
}

