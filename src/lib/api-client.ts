import { toast } from '@/components/ui/use-toast';

interface FetchOptions extends RequestInit {
    retries?: number;
    retryDelay?: number;
    timeout?: number;
    onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000;
const DEFAULT_TIMEOUT = 10000;

export class ApiError extends Error {
    status: number;
    data: any;

    constructor(message: string, status: number, data?: any) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

async function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function apiFetch<T = any>(
    url: string,
    options: FetchOptions = {}
): Promise<T> {
    const {
        retries = DEFAULT_RETRIES,
        retryDelay = DEFAULT_RETRY_DELAY,
        timeout = DEFAULT_TIMEOUT,
        onRetry,
        ...fetchOptions
    } = options;

    let attempt = 0;

    while (attempt <= retries) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...fetchOptions,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch {
                    errorData = { message: response.statusText };
                }
                throw new ApiError(
                    errorData.message || errorData.error || 'API request failed',
                    response.status,
                    errorData
                );
            }

            // Handle 204 No Content
            if (response.status === 204) {
                return {} as T;
            }

            return await response.json();
        } catch (error: any) {
            clearTimeout(timeoutId);

            const isAbortError = error.name === 'AbortError';
            const isNetworkError = !error.status && !isAbortError;

            // Don't retry on 4xx errors (client errors) unless it's 429 (Too Many Requests)
            const shouldRetry =
                attempt < retries &&
                (isNetworkError || isAbortError || error.status === 429 || error.status >= 500);

            if (shouldRetry) {
                attempt++;
                if (onRetry) onRetry(attempt, error);

                // Exponential backoff
                const delay = retryDelay * Math.pow(2, attempt - 1);
                await wait(delay);
                continue;
            }

            // Format error for toast
            const errorMessage = isAbortError
                ? 'Request timed out'
                : error.message || 'Something went wrong';

            // Only show toast for non-GET requests or critical failures
            if (options.method && options.method !== 'GET') {
                toast({
                    title: 'Error',
                    description: errorMessage,
                    variant: 'destructive',
                });
            }

            throw error;
        }
    }

    throw new Error('Max retries exceeded');
}

// Convenience methods
export const api = {
    get: <T>(url: string, options?: FetchOptions) =>
        apiFetch<T>(url, { ...options, method: 'GET' }),

    post: <T>(url: string, data: any, options?: FetchOptions) =>
        apiFetch<T>(url, {
            ...options,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            body: JSON.stringify(data),
        }),

    put: <T>(url: string, data: any, options?: FetchOptions) =>
        apiFetch<T>(url, {
            ...options,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            body: JSON.stringify(data),
        }),

    delete: <T>(url: string, options?: FetchOptions) =>
        apiFetch<T>(url, { ...options, method: 'DELETE' }),

    patch: <T>(url: string, data: any, options?: FetchOptions) =>
        apiFetch<T>(url, {
            ...options,
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            body: JSON.stringify(data),
        }),
};
