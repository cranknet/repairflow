import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

/**
 * Get encryption key from environment variable
 * Falls back to a default key for development (NOT FOR PRODUCTION)
 */
function getEncryptionKey(): Buffer {
    const keyHex = process.env.EMAIL_ENCRYPTION_KEY;

    if (!keyHex) {
        console.warn(
            'EMAIL_ENCRYPTION_KEY not set. Using insecure default key for development. ' +
            'Generate a secure key with: npm run generate-email-key'
        );
        // Default key for development only - 32 bytes (256 bits)
        return Buffer.from('0'.repeat(64), 'hex');
    }

    const key = Buffer.from(keyHex, 'hex');

    if (key.length !== 32) {
        throw new Error(
            'EMAIL_ENCRYPTION_KEY must be 32 bytes (64 hex characters). ' +
            'Generate one with: npm run generate-email-key'
        );
    }

    return key;
}

/**
 * Encrypt a string using AES-256-GCM
 * Returns format: iv:authTag:encryptedData (all hex encoded)
 */
export function encrypt(text: string): string {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt a string that was encrypted with the encrypt function
 * Expects format: iv:authTag:encryptedData (all hex encoded)
 */
export function decrypt(encryptedData: string): string {
    const key = getEncryptionKey();
    const parts = encryptedData.split(':');

    if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
    }

    const [ivHex, authTagHex, encrypted] = parts;

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}
