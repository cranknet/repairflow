/**
 * React hook for checking feature flags
 */

'use client';

import { useSession } from 'next-auth/react';
import { isFeatureEnabled, FeatureName } from '../features';

export function useFeatureFlag(feature: FeatureName): boolean {
    const { data: session } = useSession();

    if (!session?.user) {
        return false;
    }

    return isFeatureEnabled(feature, session.user.role);
}
