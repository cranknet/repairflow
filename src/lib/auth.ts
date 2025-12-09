import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

const getAuthSecret = (): string => {
  // Auth.js v5 uses AUTH_SECRET; fall back to NEXTAUTH_SECRET for backward compatibility
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'AUTH_SECRET (or NEXTAUTH_SECRET) environment variable must be set and at least 32 characters long.\n' +
      'Generate one with: openssl rand -base64 32'
    );
  }
  return secret;
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: getAuthSecret(),
  trustHost: true,
});

// Export authOptions for backward compatibility if needed
export const authOptions = authConfig;
