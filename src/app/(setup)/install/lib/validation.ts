import { z } from 'zod';

/**
 * Validation schemas for the installer wizard forms
 */

// Company information schema
export const companySchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  company_email: z.string().email('Invalid email address'),
  company_phone: z.string().min(1, 'Phone number is required'),
  company_address: z.string().optional(),
  country: z.string().min(2, 'Country is required'),
  language: z.enum(['en', 'fr', 'ar']),
  currency: z.string().min(3, 'Currency is required'),
});

export type CompanyFormData = z.infer<typeof companySchema>;

// Admin user creation schema
export const adminSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  name: z.string().min(1, 'Name is required'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type AdminFormData = z.infer<typeof adminSchema>;

// System preferences schema
export const preferencesSchema = z.object({
  timezone: z.string().optional(),
  sms_enabled: z.boolean().default(false),
  facebook_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  youtube_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  instagram_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
});

export type PreferencesFormData = z.infer<typeof preferencesSchema>;

// Sample data loading schema
export const sampleDataSchema = z.object({
  loadSampleData: z.boolean().default(false),
});

export type SampleDataFormData = z.infer<typeof sampleDataSchema>;

// Environment check result type
export interface EnvCheckResult {
  key: string;
  label: string;
  status: 'ok' | 'warning' | 'error';
  required: boolean;
  message?: string;
}

// Installation state stored in session
export interface InstallState {
  currentStep: number;
  company?: CompanyFormData;
  admin?: Omit<AdminFormData, 'confirmPassword'>;
  preferences?: PreferencesFormData;
  branding?: {
    logo?: string;
    favicon?: string;
    loginBackground?: string;
  };
  loadSampleData?: boolean;
}
