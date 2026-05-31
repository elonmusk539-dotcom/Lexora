'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Import with ssr:false to prevent static prerendering —
// this page uses useSearchParams + auth and must run client-side only.
const SuccessContent = dynamic(
  () => import('./SuccessContent').then(m => m.SuccessContent),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-mesh">
        <div className="flex flex-col items-center justify-center h-screen">
          <Loader2 className="w-12 h-12 animate-spin text-[var(--color-accent-primary)] mb-4" />
          <p className="text-[var(--color-text-muted)]">Loading...</p>
        </div>
      </div>
    ),
  }
);

export default function SuccessPage() {
  return <SuccessContent />;
}
