const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const sqlitePath = path.join(__dirname, '../prisma/schema.sqlite.prisma');
const postgresPath = path.join(__dirname, '../prisma/schema.postgres.prisma');

// Determine environment
const isVercel = process.env.VERCEL === '1';
const isProduction = process.env.NODE_ENV === 'production';
const forcedProvider = process.env.DATABASE_PROVIDER; // 'sqlite' or 'postgresql'
const databaseUrl = process.env.DATABASE_URL || '';

let usePostgres = false;

// Prioritize explicit DATABASE_PROVIDER setting
if (forcedProvider) {
  usePostgres = forcedProvider === 'postgresql';
  console.log(`[Database Setup] Using forced provider: ${forcedProvider}`);
} else if (isVercel) {
  // Vercel is always Postgres in this setup
  usePostgres = true;
  console.log('[Database Setup] Detected Vercel environment, using PostgreSQL');
} else if (databaseUrl.startsWith('postgres')) {
  // Auto-detect PostgreSQL from DATABASE_URL
  usePostgres = true;
  console.log('[Database Setup] Detected PostgreSQL connection string');
} else if (isProduction) {
  // Local production build might want Postgres, but typically local dev is sqlite.
  // If running 'npm run build' locally, we might want to keep it SQLite if we are just testing build.
  // BUT, the user said "production automatically switches to PostgreSQL".
  // Safest bet: If NODE_ENV=production, use Postgres.
  // To build locally with SQLite for testing, use DATABASE_PROVIDER=sqlite
  usePostgres = true;
  console.log('[Database Setup] Production environment detected, using PostgreSQL');
}

const sourcePath = usePostgres ? postgresPath : sqlitePath;
const providerName = usePostgres ? 'PostgreSQL' : 'SQLite';

// Mask DATABASE_URL for logging (hide password)
const maskedUrl = databaseUrl
  ? databaseUrl.replace(/:([^:@]+)@/, ':****@') // Hide password
  : 'Not set';

console.log(`[Database Setup] Detected environment: ${isVercel ? 'Vercel' : 'Local'} (${process.env.NODE_ENV || 'development'})`);
console.log(`[Database Setup] Selected Provider: ${providerName}`);
console.log(`[Database Setup] DATABASE_URL: ${maskedUrl}`);
console.log(`[Database Setup] Copying ${path.basename(sourcePath)} to schema.prisma`);

// Validate DATABASE_URL for PostgreSQL
if (usePostgres && !databaseUrl) {
  console.error('[Database Setup] ERROR: DATABASE_URL is not set but PostgreSQL is required!');
  console.error('[Database Setup] Please set DATABASE_URL environment variable in Vercel');
  process.exit(1);
}

if (usePostgres && !databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('[Database Setup] ERROR: DATABASE_URL does not appear to be a valid PostgreSQL connection string!');
  console.error(`[Database Setup] Current value: ${maskedUrl}`);
  process.exit(1);
}

try {
  // Ensure the source exists
  if (!fs.existsSync(sourcePath)) {
    console.error(`[Database Setup] Error: Source file ${sourcePath} not found.`);
    process.exit(1);
  }

  fs.copyFileSync(sourcePath, schemaPath);
  console.log('[Database Setup] Schema updated successfully.');
} catch (error) {
  console.error('[Database Setup] Error copying schema file:', error);
  process.exit(1);
}
