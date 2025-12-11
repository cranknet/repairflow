/**
 * Feature Flags Utility
 * 
 * Environment-based feature flags for enabling/disabling features in production.
 * This allows gradual rollout and quick disable of experimental features.
 */

/**
 * Get the value of a feature flag from environment variables.
 * @param flagName - The name of the feature flag (without FEATURE_ prefix)
 * @param defaultValue - Default value if the flag is not set
 * @returns boolean indicating if the feature is enabled
 */
export function isFeatureEnabled(flagName: string, defaultValue = true): boolean {
    const envValue = process.env[`FEATURE_${flagName.toUpperCase()}`];

    if (envValue === undefined || envValue === '') {
        return defaultValue;
    }

    return envValue.toLowerCase() === 'true' || envValue === '1';
}

/**
 * Feature flag constants for type safety
 */
export const FEATURE_FLAGS = {
    AI_VISION: 'AI_VISION',
    PRINTING: 'PRINTING',
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

/**
 * Check if AI Vision feature is enabled
 */
export function isAIVisionEnabled(): boolean {
    return isFeatureEnabled(FEATURE_FLAGS.AI_VISION, true);
}

/**
 * Check if Printing feature is enabled
 */
export function isPrintingEnabled(): boolean {
    return isFeatureEnabled(FEATURE_FLAGS.PRINTING, true);
}

/**
 * Get all feature flag statuses for debugging/admin purposes
 */
export function getAllFeatureFlags(): Record<FeatureFlag, boolean> {
    return {
        AI_VISION: isAIVisionEnabled(),
        PRINTING: isPrintingEnabled(),
    };
}
