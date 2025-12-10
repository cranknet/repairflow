'use client';

import { WifiIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function OfflinePage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
            <div className="text-center p-8 max-w-md">
                {/* Offline Icon */}
                <div className="mb-8">
                    <div className="w-24 h-24 mx-auto rounded-full bg-slate-800 flex items-center justify-center relative">
                        <WifiIcon className="w-12 h-12 text-slate-400" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-0.5 bg-red-500 rotate-45" />
                        </div>
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-white mb-3">
                    You&apos;re Offline
                </h1>

                {/* Description */}
                <p className="text-slate-400 mb-8 text-lg">
                    It looks like you&apos;ve lost your internet connection.
                    Some features may be unavailable until you&apos;re back online.
                </p>

                {/* Retry Button */}
                <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors font-medium"
                >
                    <ArrowPathIcon className="w-5 h-5" />
                    Try Again
                </button>

                {/* Additional Info */}
                <p className="mt-8 text-slate-500 text-sm">
                    RepairFlow will automatically reconnect when your connection is restored.
                </p>
            </div>
        </div>
    );
}
