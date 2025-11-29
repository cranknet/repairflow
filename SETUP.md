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

The application includes a setup wizard that runs on first launch. Follow the instructions to create your admin account and configure the system.

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

## Desktop App Setup

For instructions on running and building the Windows desktop application, please refer to [ELECTRON.md](ELECTRON.md).


