/**
 * Feature Flags Configuration
 * Hybrid approach: environment variable + user permission check
 */

export const FEATURES = {
    FINANCE_MODULE: 'finance_module',
} as const;

export type FeatureName = typeof FEATURES[keyof typeof FEATURES];

/**
 * Check if a feature is enabled based on environment variable
 */
export function isFeatureEnabledInEnv(feature: FeatureName): boolean {
    // Check environment variable
    const envVar = `NEXT_PUBLIC_FEATURE_${feature.toUpperCase()}`;
    const envValue = process.env[envVar];

    return envValue === 'true' || envValue === '1';
}

/**
 * Check if user has permission for a feature
 */
export function userHasFeaturePermission(userRole: string, feature: FeatureName): boolean {
    // For now, all finance features require ADMIN role
    if (feature === FEATURES.FINANCE_MODULE) {
        return userRole === 'ADMIN';
    }

    return false;
}

/**
 * Check if a feature is enabled (hybrid: env + permission)
 * Returns true only if BOTH conditions are met
 */
export function isFeatureEnabled(
    feature: FeatureName,
    userRole?: string
): boolean {
    // Check environment variable first
    const envEnabled = isFeatureEnabledInEnv(feature);

    // If not enabled in env, return false immediately
    if (!envEnabled) {
        return false;
    }

    // If no user role provided, can't check permissions
    if (!userRole) {
        return false;
    }

    // Check user permission
    return userHasFeaturePermission(userRole, feature);
}
