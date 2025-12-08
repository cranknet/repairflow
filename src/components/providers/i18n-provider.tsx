'use client';

import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n-config';

interface I18nProviderWrapperProps {
    children: React.ReactNode;
}

/**
 * I18n Provider Wrapper
 * 
 * This component initializes i18next and provides it to the React tree.
 * It should wrap the LanguageProvider in the application root.
 */
export function I18nProviderWrapper({ children }: I18nProviderWrapperProps) {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // i18n is already initialized in i18n-config.ts
        // Just mark as ready once mounted
        setIsReady(true);
    }, []);

    // Show nothing while initializing to prevent hydration mismatch
    if (!isReady) {
        return null;
    }

    return (
        <I18nextProvider i18n={i18n}>
            {children}
        </I18nextProvider>
    );
}
