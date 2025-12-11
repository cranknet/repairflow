/**
 * SMS Service Abstraction
 *
 * Unified interface for sending SMS via:
 * - Hardware: COM port GSM modem (via Tauri serial commands)
 * - httpSMS: HTTP-based SMS gateway
 *
 * Automatically uses Tauri commands when running as desktop app,
 * falls back to API routes when running as web app.
 */

import { isTauri } from './platform';

// ============================================
// Types
// ============================================

export type SmsProvider = 'hardware' | 'httpsms';

export interface COMPort {
    path: string;
    manufacturer?: string;
    serialNumber?: string;
    pnpId?: string;
    portType?: string;
}

export interface SmsConfig {
    provider: SmsProvider;
    // Hardware (COM port) settings
    portPath?: string;
    baudRate?: number;
    // httpSMS settings
    apiKey?: string;
    fromPhone?: string;
}

export interface SmsResult {
    success: boolean;
    error?: string;
}

// ============================================
// Serial Port Functions
// ============================================

/**
 * List available serial ports
 */
export async function listSerialPorts(): Promise<COMPort[]> {
    if (isTauri()) {
        const { invoke } = await import('@tauri-apps/api/core');
        return invoke<COMPort[]>('list_serial_ports');
    }

    // Web fallback - call API route
    const response = await fetch('/api/sms/ports');
    if (!response.ok) {
        throw new Error('Failed to list ports');
    }
    return response.json();
}

// ============================================
// SMS Sending Functions
// ============================================

/**
 * Send SMS via hardware COM port
 */
async function sendSmsHardware(
    portPath: string,
    phoneNumber: string,
    message: string,
    baudRate = 9600
): Promise<boolean> {
    if (isTauri()) {
        const { invoke } = await import('@tauri-apps/api/core');
        return invoke<boolean>('send_sms_serial', {
            portPath,
            phoneNumber,
            message,
            baudRate,
        });
    }

    // Web fallback
    const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            portPath,
            phoneNumber,
            message,
        }),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Failed to send SMS');
    }
    return data.success;
}

/**
 * Send SMS via httpSMS gateway
 */
async function sendSmsHttp(
    apiKey: string,
    fromPhone: string,
    toPhone: string,
    message: string
): Promise<boolean> {
    if (isTauri()) {
        const { invoke } = await import('@tauri-apps/api/core');
        return invoke<boolean>('send_sms_http', {
            apiKey,
            fromPhone,
            toPhone,
            message,
        });
    }

    // Web fallback - direct API call (since httpSMS is HTTP-based)
    const response = await fetch('https://api.httpsms.com/v1/messages/send', {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            content: message,
            from: fromPhone,
            to: toPhone,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`httpSMS error: ${error}`);
    }

    return true;
}

/**
 * Check httpSMS API connection and key validity
 */
export async function checkHttpSmsConnection(apiKey: string): Promise<boolean> {
    if (isTauri()) {
        const { invoke } = await import('@tauri-apps/api/core');
        return invoke<boolean>('check_httpsms_connection', { apiKey });
    }

    // Web fallback
    const response = await fetch('https://api.httpsms.com/v1/users/me', {
        headers: { 'x-api-key': apiKey },
    });

    return response.ok;
}

// ============================================
// Unified Send Function
// ============================================

/**
 * Send SMS using the configured provider
 *
 * @param config - SMS configuration (provider, credentials)
 * @param toPhone - Recipient phone number
 * @param message - SMS message content
 */
export async function sendSMS(
    config: SmsConfig,
    toPhone: string,
    message: string
): Promise<SmsResult> {
    try {
        if (config.provider === 'httpsms') {
            if (!config.apiKey || !config.fromPhone) {
                throw new Error('httpSMS requires apiKey and fromPhone');
            }
            await sendSmsHttp(config.apiKey, config.fromPhone, toPhone, message);
        } else {
            if (!config.portPath) {
                throw new Error('Hardware SMS requires portPath');
            }
            await sendSmsHardware(
                config.portPath,
                toPhone,
                message,
                config.baudRate || 9600
            );
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
