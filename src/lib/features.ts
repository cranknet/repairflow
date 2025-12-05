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
 * Note: In Next.js, NEXT_PUBLIC_ env vars are embedded at build time
 * and must be accessed directly, not dynamically
 */
export function isFeatureEnabledInEnv(feature: FeatureName): boolean {
    // Check environment variable - must access directly for client-side code
    if (feature === FEATURES.FINANCE_MODULE) {
        const envValue = process.env.NEXT_PUBLIC_FEATURE_FINANCE_MODULE;
        return envValue === 'true' || envValue === '1';
    }
    
    // Default to false for unknown features
    return false;
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
