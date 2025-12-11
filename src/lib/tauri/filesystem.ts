/**
 * Filesystem Utilities
 *
 * Native filesystem access for Tauri desktop app:
 * - Custom database location
 * - Config file management
 * - Log directory access
 */

import { isTauri } from './platform';

// ============================================
// Types
// ============================================

export interface AppConfig {
    databasePath?: string;
    smsProvider?: 'hardware' | 'httpsms';
    httpSmsApiKey?: string;
    httpSmsFromPhone?: string;
    comPortPath?: string;
    comPortBaudRate?: number;
}

// ============================================
// Database Path Functions
// ============================================

/**
 * Get the default database path
 */
export async function getDefaultDatabasePath(): Promise<string> {
    if (!isTauri()) {
        // Web mode uses server-side database
        return 'file:./prisma/dev.db';
    }

    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<string>('get_default_database_path');
}

/**
 * Validate a custom database path
 */
export async function validateDatabasePath(path: string): Promise<boolean> {
    if (!isTauri()) {
        return false; // Web mode doesn't support custom paths
    }

    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<boolean>('validate_database_path', { path });
}

// ============================================
// Config File Functions
// ============================================

/**
 * Read app configuration from local file
 */
export async function readConfig(): Promise<AppConfig> {
    if (!isTauri()) {
        // Web mode uses localStorage fallback
        const stored = localStorage.getItem('repairflow_config');
        return stored ? JSON.parse(stored) : {};
    }

    const { invoke } = await import('@tauri-apps/api/core');
    const configJson = await invoke<string>('read_config_file');
    return JSON.parse(configJson);
}

/**
 * Write app configuration to local file
 */
export async function writeConfig(config: AppConfig): Promise<void> {
    if (!isTauri()) {
        // Web mode uses localStorage fallback
        localStorage.setItem('repairflow_config', JSON.stringify(config));
        return;
    }

    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('write_config_file', { config: JSON.stringify(config, null, 2) });
}

/**
 * Update a single config value
 */
export async function updateConfig<K extends keyof AppConfig>(
    key: K,
    value: AppConfig[K]
): Promise<void> {
    const config = await readConfig();
    config[key] = value;
    await writeConfig(config);
}

// ============================================
// Log Directory Functions
// ============================================

/**
 * Get the log directory path
 */
export async function getLogDirectory(): Promise<string | null> {
    if (!isTauri()) {
        return null; // Web mode doesn't have local logs
    }

    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<string>('get_log_directory');
}
