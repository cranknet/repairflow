import { Suspense } from 'react';
import { TrackContent } from './track-content';

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <TrackContent />
    </Suspense>
  );
}

