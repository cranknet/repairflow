import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;

// Ensure this route uses Node.js runtime (not Edge)
export const runtime = 'nodejs';

