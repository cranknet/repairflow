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

The application includes an **8-step installation wizard** that runs on first launch:

### Wizard Steps

1. **Welcome** - Environment validation
   - Checks required variables: `DATABASE_URL`, `AUTH_SECRET`/`NEXTAUTH_SECRET`
   - Warns about optional variables: `SMTP_*`, `EMAIL_ENCRYPTION_KEY`

2. **Database** - Connection test
   - Tests database connectivity
   - Verifies read/write access

3. **Company** - Business information
   - Company name, email, phone, address
   - Default country, language, and currency

4. **Branding** - Visual customization (optional)
   - Upload company logo (recommended: 200x200px)
   - Upload favicon (recommended: 32x32px)
   - Upload login background (recommended: 1920x1080px)

5. **Admin** - Administrator account
   - Create username, email, password
   - Password strength indicator included

6. **Preferences** - System settings
   - Timezone selection
   - Enable/disable SMS notifications
   - Social media links (Facebook, YouTube, Instagram)
   - Default theme (light/dark/system)

7. **Sample Data** - Demo content (optional)
   - Load 5 sample customers
   - Load 3 sample suppliers
   - Load 5 sample parts

8. **Finalize** - Complete installation
   - Review configuration summary
   - Complete installation and redirect to login

### Re-running the Wizard

To reset the database and run the wizard again:

```bash
npx prisma db push --force-reset
npm run dev
```

Then navigate to `http://localhost:3000/` - you'll be redirected to `/install`.

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


