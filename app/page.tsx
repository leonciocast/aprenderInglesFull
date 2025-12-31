'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RootRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Immediately send you to /uploader
    router.replace('/uploader');
  }, [router]);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#020617',
        color: '#e5e7eb',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <p>Loading uploader…</p>
    </main>
  );
}

