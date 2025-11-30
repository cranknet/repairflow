# Setup Instructions

## Environment Variables

Create a `.env` file in the root directory with the following:

```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@repairshop.com"
```

**Important**: Generate a secure `NEXTAUTH_SECRET`. You can use:
- PowerShell: `[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString()))`
- Or any random 32+ character string

## Running the Application

1. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

2. Set up the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Setup Wizard

The application includes a setup wizard that runs on first launch. Follow the instructions to:
1. Create your administrator account
2. Configure company details
3. Set up initial preferences

After completing the setup wizard, you'll be redirected to the main dashboard.

## Initial Configuration

After setup, configure your system through the Settings page (Admin only):

### General Settings
- Company name, email, phone, and address
- Currency and country selection
- Timezone preferences

### Branding
- Upload company logo
- Upload favicon
- Set login background image

### Social Media
- Add Facebook, YouTube, and Instagram links
- These links appear on the public tracking page

### SMS Templates
- Create SMS templates for different ticket statuses
- Support for multiple languages (English, French, Arabic)
- Use variables: `{customerName}`, `{ticketNumber}`, `{trackingCode}`, `{finalPrice}`
- **SMS Sending**: Requires a GSM modem or USB dongle connected via COM port (web platform only)
- COM ports are automatically detected when sending SMS
- Mobile devices: Native Android SMS integration coming soon

### User Management
- Create additional staff accounts
- Assign roles (Admin or Staff)
- View login logs for security monitoring

### Ticket Workflow
The system supports the following ticket statuses:
- **RECEIVED**: Initial status when ticket is created
- **IN_PROGRESS**: Repair work has started
- **WAITING_FOR_PARTS**: Waiting for parts to arrive
- **REPAIRED**: Device has been repaired
- **COMPLETED**: Ticket is fully completed
- **CANCELLED**: Ticket was cancelled (terminal status)
- **RETURNED**: Ticket was returned to customer (terminal status, set automatically when return is created)

**Note**: Once a ticket is marked as CANCELLED or RETURNED, its status cannot be changed.

## Troubleshooting

### Database Issues
- Make sure `DATABASE_URL` is set correctly
- Run `npx prisma db push` if schema changes were made
- Check that `prisma/dev.db` file exists

### Authentication Issues
- Ensure `NEXTAUTH_SECRET` is set
- Check that `NEXTAUTH_URL` matches your development URL
- Clear browser cookies if login issues persist

### Build Errors
- Run `npm install --legacy-peer-deps` if dependency conflicts occur
- Delete `node_modules` and `.next` folders, then reinstall if needed

## Database Options

### SQLite (Default)
- Local file-based database
- Perfect for single-user installations
- No additional setup required
- Database file location: `prisma/dev.db`

### MySQL/PostgreSQL
- For multi-user or production deployments
- Update `DATABASE_URL` in `.env`:
  ```env
  DATABASE_URL="mysql://user:password@localhost:3306/repairflow"
  # or
  DATABASE_URL="postgresql://user:password@localhost:5432/repairflow"
  ```
- Run migrations: `npx prisma migrate dev`


