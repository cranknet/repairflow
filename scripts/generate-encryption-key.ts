import crypto from 'crypto';

/**
 * Generate a secure 256-bit encryption key for EMAIL_ENCRYPTION_KEY
 * Usage: npm run generate-email-key
 */
function generateEncryptionKey() {
    const key = crypto.randomBytes(32).toString('hex');

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  Email Encryption Key Generated                           ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log('Add this line to your .env file:\n');
    console.log(`EMAIL_ENCRYPTION_KEY=${key}\n`);
    console.log('⚠️  IMPORTANT:');
    console.log('- Keep this key secure and never commit it to version control');
    console.log('- Use the same key across deployments to decrypt existing passwords');
    console.log('- If you lose this key, you will need to re-enter all SMTP passwords\n');
}

generateEncryptionKey();
