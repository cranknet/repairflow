import { Suspense } from 'react';
import { TrackContent } from '@/components/track/track-content';

export const metadata = {
    title: 'Track Your Repair',
    description: 'Track the status of your device repair in real-time',
};

export default function TrackPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <TrackContent />
        </Suspense>
    );
}
