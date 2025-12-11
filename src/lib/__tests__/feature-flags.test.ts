/**
 * Feature Flags Unit Tests
 */
import {
    isFeatureEnabled,
    isAIVisionEnabled,
    isPrintingEnabled,
    getAllFeatureFlags,
    FEATURE_FLAGS
} from '../feature-flags';

describe('Feature Flags', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    describe('isFeatureEnabled', () => {
        it('returns default value when env var is not set', () => {
            delete process.env.FEATURE_TEST_FLAG;
            expect(isFeatureEnabled('TEST_FLAG', true)).toBe(true);
            expect(isFeatureEnabled('TEST_FLAG', false)).toBe(false);
        });

        it('returns true when env var is "true"', () => {
            process.env.FEATURE_TEST_FLAG = 'true';
            expect(isFeatureEnabled('TEST_FLAG')).toBe(true);
        });

        it('returns true when env var is "1"', () => {
            process.env.FEATURE_TEST_FLAG = '1';
            expect(isFeatureEnabled('TEST_FLAG')).toBe(true);
        });

        it('returns false when env var is "false"', () => {
            process.env.FEATURE_TEST_FLAG = 'false';
            expect(isFeatureEnabled('TEST_FLAG')).toBe(false);
        });

        it('returns false when env var is empty string', () => {
            process.env.FEATURE_TEST_FLAG = '';
            expect(isFeatureEnabled('TEST_FLAG', false)).toBe(false);
        });

        it('is case insensitive', () => {
            process.env.FEATURE_TEST_FLAG = 'TRUE';
            expect(isFeatureEnabled('TEST_FLAG')).toBe(true);

            process.env.FEATURE_TEST_FLAG = 'True';
            expect(isFeatureEnabled('TEST_FLAG')).toBe(true);
        });
    });

    describe('isAIVisionEnabled', () => {
        it('returns true by default', () => {
            delete process.env.FEATURE_AI_VISION;
            expect(isAIVisionEnabled()).toBe(true);
        });

        it('returns false when disabled', () => {
            process.env.FEATURE_AI_VISION = 'false';
            expect(isAIVisionEnabled()).toBe(false);
        });
    });

    describe('isPrintingEnabled', () => {
        it('returns true by default', () => {
            delete process.env.FEATURE_PRINTING;
            expect(isPrintingEnabled()).toBe(true);
        });

        it('returns false when disabled', () => {
            process.env.FEATURE_PRINTING = 'false';
            expect(isPrintingEnabled()).toBe(false);
        });
    });

    describe('getAllFeatureFlags', () => {
        it('returns all feature flags status', () => {
            process.env.FEATURE_AI_VISION = 'true';
            process.env.FEATURE_PRINTING = 'false';

            const flags = getAllFeatureFlags();

            expect(flags).toEqual({
                AI_VISION: true,
                PRINTING: false,
            });
        });
    });

    describe('FEATURE_FLAGS constant', () => {
        it('contains expected flags', () => {
            expect(FEATURE_FLAGS.AI_VISION).toBe('AI_VISION');
            expect(FEATURE_FLAGS.PRINTING).toBe('PRINTING');
        });
    });
});
