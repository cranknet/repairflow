import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, CacheFirst, NetworkFirst, ExpirationPlugin } from "serwist";

// TypeScript declarations for service worker global scope
declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    }
}

declare const self: ServiceWorkerGlobalScope;

const customRuntimeCaching = [
    {
        matcher: ({ url }: { url: URL }) => url.pathname.startsWith("/api/"),
        handler: new NetworkFirst({
            cacheName: "api-cache",
            plugins: [
                new ExpirationPlugin({
                    maxEntries: 50,
                    maxAgeSeconds: 5 * 60, // 5 minutes
                }),
            ],
        }),
    },
    {
        matcher: ({ request }: { request: Request }) => request.destination === "image",
        handler: new CacheFirst({
            cacheName: "image-cache",
            plugins: [
                new ExpirationPlugin({
                    maxEntries: 100,
                    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                }),
            ],
        }),
    },
    ...defaultCache,
];

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    // Use custom caching strategies
    runtimeCaching: customRuntimeCaching,
    fallbacks: {
        entries: [
            {
                url: "/offline",
                matcher({ request }) {
                    return request.destination === "document";
                },
            },
        ],
    },
});

// Custom fetch handler to skip external URLs and let browser handle them directly
self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // Skip caching for external domains - let browser handle directly
    if (url.origin !== self.location.origin) {
        // Don't intercept cross-origin requests
        return;
    }
});

serwist.addEventListeners();
