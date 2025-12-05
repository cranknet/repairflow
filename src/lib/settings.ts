import { prisma } from '@/lib/prisma';

/**
 * Get a setting value from the database
 * @param key The setting key
 * @param defaultValue The default value if setting is not found
 * @returns The setting value or default
 */
export async function getSetting(key: string, defaultValue: string = ''): Promise<string> {
  try {
    const setting = await prisma.settings.findUnique({
      where: { key },
    });
    return setting?.value ?? defaultValue;
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Get a boolean setting value from the database
 * @param key The setting key
 * @param defaultValue The default value if setting is not found
 * @returns The setting value as boolean
 */
export async function getBooleanSetting(key: string, defaultValue: boolean = false): Promise<boolean> {
  const value = await getSetting(key, defaultValue.toString());
  return value === 'true' || value === '1';
}

/**
 * Check if tickets should be automatically marked as paid upon creation
 * @returns true if auto-mark-as-paid is enabled (default: false)
 */
export async function shouldAutoMarkTicketsAsPaid(): Promise<boolean> {
  return getBooleanSetting('auto_mark_tickets_as_paid', false);
}

/**
 * Set a setting value in the database
 * @param key The setting key
 * @param value The setting value
 */
export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.settings.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

