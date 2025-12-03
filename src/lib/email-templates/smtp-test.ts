export interface SMTPTestEmailData {
    companyName: string;
    testTime: string;
}

export function getSMTPTestEmailTemplate(data: SMTPTestEmailData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SMTP Test Email</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #2563eb;
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .success-badge {
      display: inline-block;
      background-color: #10b981;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
      margin-top: 10px;
    }
    .content {
      margin: 20px 0;
    }
    .info-box {
      background-color: #f0f9ff;
      border-left: 4px solid #2563eb;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ SMTP Configuration Test</h1>
      <span class="success-badge">Connection Successful</span>
    </div>
    
    <div class="content">
      <p>Hello,</p>
      
      <p>This is a test email from your <strong>${data.companyName}</strong> installation.</p>
      
      <p>If you're reading this message, congratulations! Your SMTP email settings are configured correctly and emails are being sent successfully.</p>
      
      <div class="info-box">
        <strong>Test Details:</strong><br>
        • Sent at: ${data.testTime}<br>
        • System: ${data.companyName}<br>
        • Status: All systems operational
      </div>
      
      <p>You can now use the email functionality for:</p>
      <ul>
        <li>Password reset emails</li>
        <li>Customer notifications</li>
        <li>Ticket status updates</li>
        <li>And more...</li>
      </ul>
    </div>
    
    <div class="footer">
      <p>This is an automated test email from ${data.companyName}.</p>
      <p>If you did not request this test, please contact your system administrator.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
