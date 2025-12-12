const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const sqlitePath = path.join(__dirname, '../prisma/schema.sqlite.prisma');
const postgresPath = path.join(__dirname, '../prisma/schema.postgres.prisma');

// Determine environment
const isVercel = process.env.VERCEL === '1';
const isProduction = process.env.NODE_ENV === 'production';
const forcedProvider = process.env.DATABASE_PROVIDER; // 'sqlite' or 'postgresql'

let usePostgres = false;

if (forcedProvider) {
  usePostgres = forcedProvider === 'postgresql';
} else if (isVercel) {
    // Vercel is always Postgres in this setup
    usePostgres = true;
} else if (isProduction) {
    // Local production build might want Postgres, but typically local dev is sqlite.
    // If running 'npm run build' locally, we might want to keep it SQLite if we are just testing build.
    // BUT, the user said "production automatically switches to PostgreSQL".
    // Safest bet: If NODE_ENV=production, use Postgres.
    // To build locally with SQLite for testing, use DATABASE_PROVIDER=sqlite
    usePostgres = true;
}

const sourcePath = usePostgres ? postgresPath : sqlitePath;
const providerName = usePostgres ? 'PostgreSQL' : 'SQLite';

console.log(`[Database Setup] Detected environment: ${isVercel ? 'Vercel' : 'Local'} (${process.env.NODE_ENV || 'development'})`);
console.log(`[Database Setup] Selected Provider: ${providerName}`);
console.log(`[Database Setup] Copying ${path.basename(sourcePath)} to schema.prisma`);

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
