import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

// TypeScript declarations for service worker global scope
declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    // Use default caching but handle external resources at fetch level
    runtimeCaching: defaultCache,
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
