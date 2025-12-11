/**
 * Tauri Integration Module
 *
 * Re-exports all Tauri-related utilities for easy importing.
 *
 * @example
 * import { isTauri, sendSMS, listSerialPorts } from '@/lib/tauri';
 */

// Platform detection
export { isTauri, isDesktop, isWeb, getPlatform, getOS } from './platform';

// SMS functionality
export {
    sendSMS,
    listSerialPorts,
    checkHttpSmsConnection,
    type SmsProvider,
    type SmsConfig,
    type SmsResult,
    type COMPort,
} from './sms';

// Filesystem utilities
export {
    getDefaultDatabasePath,
    validateDatabasePath,
    readConfig,
    writeConfig,
    updateConfig,
    getLogDirectory,
    type AppConfig,
} from './filesystem';
