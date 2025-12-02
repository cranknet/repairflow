export interface PasswordChangedEmailData {
  name: string;
  timestamp: string;
  companyName: string;
  supportContact?: string;
}

export function getPasswordChangedEmailTemplate(data: PasswordChangedEmailData): string {
  const { name, timestamp, companyName, supportContact } = data;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Changed Successfully</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">${companyName}</h1>
  </div>
  
  <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background: #10b981; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
        <span style="color: white; font-size: 32px;">✓</span>
      </div>
    </div>
    
    <h2 style="color: #333; margin-top: 0; text-align: center;">Password Changed Successfully</h2>
    
    <p>Hello ${name},</p>
    
    <p>Your password was successfully changed on <strong>${timestamp}</strong>.</p>
    
    <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #065f46; font-size: 14px;">
        ✅ Your account is now secured with your new password.
      </p>
    </div>
    
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        <strong>⚠️ Security Alert:</strong> If you didn't make this change, please contact support immediately${supportContact ? ` at ${supportContact}` : ''}.
      </p>
    </div>
    
    <div style="background: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #374151; font-size: 14px;">
        <strong>💡 Tips for keeping your account secure:</strong>
      </p>
      <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #6b7280; font-size: 14px;">
        <li>Use a strong, unique password</li>
        <li>Never share your password with anyone</li>
        <li>Log out when using shared devices</li>
        <li>Enable two-factor authentication if available</li>
      </ul>
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

