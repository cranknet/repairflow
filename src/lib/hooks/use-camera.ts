'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { isMobile } from '@/lib/platform';

/**
 * Camera error types for better UX feedback
 */
export type CameraError =
    | 'not-found'        // No camera hardware detected
    | 'permission-denied' // User denied camera access
    | 'in-use'           // Camera is being used by another app
    | 'not-supported'    // Browser doesn't support camera APIs
    | 'unknown';         // Other errors

/**
 * Camera state for UI rendering
 */
export interface CameraState {
    isAvailable: boolean | null; // null = still checking
    isSupported: boolean;        // MediaDevices API exists
    isChecking: boolean;         // Currently checking availability
    error: CameraError | null;
    errorMessage: string | null;
}

/**
 * Hook result interface
 */
export interface UseCameraResult {
    state: CameraState;
    isMobileDevice: boolean;
    stream: MediaStream | null;
    checkAvailability: () => Promise<boolean>;
    requestAccess: (facingMode?: 'user' | 'environment') => Promise<MediaStream | null>;
    stopStream: () => void;
}

/**
 * Map browser errors to our CameraError type
 */
function mapErrorToType(error: unknown): CameraError {
    if (error instanceof DOMException) {
        switch (error.name) {
            case 'NotFoundError':
            case 'DevicesNotFoundError':
                return 'not-found';
            case 'NotAllowedError':
            case 'PermissionDeniedError':
                return 'permission-denied';
            case 'NotReadableError':
            case 'TrackStartError':
            case 'AbortError':
                return 'in-use';
            case 'NotSupportedError':
                return 'not-supported';
            default:
                return 'unknown';
        }
    }
    return 'unknown';
}

/**
 * Get human-readable error message
 */
function getErrorMessage(errorType: CameraError): string {
    switch (errorType) {
        case 'not-found':
            return 'No camera detected on this device';
        case 'permission-denied':
            return 'Camera access denied. Please allow camera access in your browser settings';
        case 'in-use':
            return 'Camera is being used by another application';
        case 'not-supported':
            return 'Camera not supported in this browser';
        default:
            return 'Failed to access camera';
    }
}

/**
 * Custom hook for camera functionality with availability checking
 * 
 * Features:
 * - Checks if camera hardware exists before attempting access
 * - Handles permission states properly
 * - Provides platform-specific behavior recommendations
 * - Maps all error types for better UX
 */
export function useCamera(): UseCameraResult {
    const [state, setState] = useState<CameraState>({
        isAvailable: null,
        isSupported: false,
        isChecking: false,
        error: null,
        errorMessage: null,
    });

    const [stream, setStream] = useState<MediaStream | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const isMobileDevice = isMobile();

    // Check if MediaDevices API is supported
    useEffect(() => {
        const isSupported = typeof navigator !== 'undefined' &&
            !!navigator.mediaDevices &&
            typeof navigator.mediaDevices.getUserMedia === 'function';

        setState(prev => ({ ...prev, isSupported }));

        // On mobile, we assume camera is available (native app handles it)
        if (isMobileDevice) {
            setState(prev => ({ ...prev, isAvailable: true }));
        }
    }, [isMobileDevice]);

    /**
     * Check if a camera is available without requesting permission
     * Uses enumerateDevices which doesn't trigger permission prompt
     */
    const checkAvailability = useCallback(async (): Promise<boolean> => {
        // On mobile, always return true (native camera app handles availability)
        if (isMobileDevice) {
            setState(prev => ({ ...prev, isAvailable: true }));
            return true;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            setState(prev => ({
                ...prev,
                isAvailable: false,
                error: 'not-supported',
                errorMessage: getErrorMessage('not-supported'),
            }));
            return false;
        }

        setState(prev => ({ ...prev, isChecking: true }));

        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasCamera = devices.some(device => device.kind === 'videoinput');

            setState(prev => ({
                ...prev,
                isAvailable: hasCamera,
                isChecking: false,
                error: hasCamera ? null : 'not-found',
                errorMessage: hasCamera ? null : getErrorMessage('not-found'),
            }));

            return hasCamera;
        } catch (error) {
            console.error('Error checking camera availability:', error);
            const errorType = mapErrorToType(error);
            setState(prev => ({
                ...prev,
                isAvailable: false,
                isChecking: false,
                error: errorType,
                errorMessage: getErrorMessage(errorType),
            }));
            return false;
        }
    }, [isMobileDevice]);

    /**
     * Request camera access and return the stream
     */
    const requestAccess = useCallback(async (
        facingMode: 'user' | 'environment' = 'environment'
    ): Promise<MediaStream | null> => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setState(prev => ({
                ...prev,
                error: 'not-supported',
                errorMessage: getErrorMessage('not-supported'),
            }));
            return null;
        }

        try {
            // First try with specified facing mode
            let mediaStream: MediaStream;
            try {
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode },
                });
            } catch {
                // Fallback to any available camera
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                });
            }

            streamRef.current = mediaStream;
            setStream(mediaStream);
            setState(prev => ({
                ...prev,
                isAvailable: true,
                error: null,
                errorMessage: null,
            }));

            return mediaStream;
        } catch (error) {
            console.error('Error accessing camera:', error);
            const errorType = mapErrorToType(error);
            setState(prev => ({
                ...prev,
                isAvailable: errorType !== 'not-found' ? prev.isAvailable : false,
                error: errorType,
                errorMessage: getErrorMessage(errorType),
            }));
            return null;
        }
    }, []);

    /**
     * Stop the current camera stream
     */
    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
            setStream(null);
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopStream();
        };
    }, [stopStream]);

    // Check camera availability on desktop when component mounts
    useEffect(() => {
        if (!isMobileDevice && state.isSupported && state.isAvailable === null) {
            checkAvailability();
        }
    }, [isMobileDevice, state.isSupported, state.isAvailable, checkAvailability]);

    return {
        state,
        isMobileDevice,
        stream,
        checkAvailability,
        requestAccess,
        stopStream,
    };
}
