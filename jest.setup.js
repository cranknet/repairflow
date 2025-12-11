import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
    useRouter() {
        return {
            push: jest.fn(),
            replace: jest.fn(),
            prefetch: jest.fn(),
            back: jest.fn(),
            pathname: '/',
            query: {},
            asPath: '/',
        };
    },
    useSearchParams() {
        return new URLSearchParams();
    },
    usePathname() {
        return '/';
    },
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
    __esModule: true,
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    default: (props) => <img {...props} />,
}));

// Mock window.matchMedia
// Mock window.matchMedia
if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        })),
    });
}

// Mock IntersectionObserver
if (typeof global.IntersectionObserver === 'undefined') {
    global.IntersectionObserver = class IntersectionObserver {
        constructor() { }
        disconnect() { }
        observe() { }
        takeRecords() {
            return [];
        }
        unobserve() { }
    };
}

// Mock i18next to prevent initialization hanging
jest.mock('i18next', () => ({
    use: jest.fn().mockReturnThis(),
    init: jest.fn().mockResolvedValue(undefined),
    t: jest.fn((key) => key),
    isInitialized: true,
    language: 'en',
    changeLanguage: jest.fn().mockResolvedValue(undefined),
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => key,
        i18n: {
            language: 'en',
            changeLanguage: jest.fn(),
        },
    }),
    initReactI18next: {
        type: '3rdParty',
        init: jest.fn(),
    },
    Trans: ({ children }) => children,
}));

// Mock i18next-browser-languagedetector
jest.mock('i18next-browser-languagedetector', () => ({
    __esModule: true,
    default: {
        type: 'languageDetector',
        detect: jest.fn().mockReturnValue('en'),
        init: jest.fn(),
        cacheUserLanguage: jest.fn(),
    },
}));

// Mock Prisma client for tests
jest.mock('@/lib/prisma', () => ({
    prisma: {
        $queryRaw: jest.fn().mockResolvedValue([{ '1': 1 }]),
        $connect: jest.fn(),
        $disconnect: jest.fn(),
        user: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        ticket: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
        customer: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    },
}));
