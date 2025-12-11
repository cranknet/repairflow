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

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    constructor() { }
    disconnect() { }
    observe() { }
    takeRecords() {
        return [];
    }
    unobserve() { }
};
