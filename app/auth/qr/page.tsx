'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function QrLoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const nextParam = useMemo(() => searchParams.get('next') || '', [searchParams]);
  const safeNext = useMemo(
    () => (nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : ''),
    [nextParam],
  );
  const [status, setStatus] = useState<'working' | 'error'>('working');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!token) {
        router.replace(`/auth/login${safeNext ? `?next=${encodeURIComponent(safeNext)}` : ''}`);
        return;
      }
      try {
        setStatus('working');
        setError('');
        const res = await fetch('/uploader/api/auth/qr-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ token }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || 'No pudimos iniciar sesión.');
        }
        if (data?.refreshToken) {
          localStorage.setItem('aif_refresh', String(data.refreshToken));
        }
        router.replace(safeNext || '/courses');
      } catch (err: any) {
        if (!active) return;
        setStatus('error');
        setError(err?.message || String(err));
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [router, safeNext, token]);

  if (status === 'error') {
    return (
      <main className="auth-page ui-shell ui-shell--light">
        <div className="auth-card ui-card">
          <span className="auth-pill">Error</span>
          <h1>No pudimos iniciar sesión</h1>
          <p className="auth-subtitle">{error || 'Inténtalo de nuevo.'}</p>
          <button
            type="button"
            className="auth-submit"
            onClick={() =>
              router.replace(
                `/auth/login${safeNext ? `?next=${encodeURIComponent(safeNext)}` : ''}`,
              )
            }
          >
            Ir a iniciar sesión
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page ui-shell ui-shell--light">
      <div className="auth-card ui-card">
        <span className="auth-pill">Conectando</span>
        <h1>Validando tu QR…</h1>
        <p className="auth-subtitle">Te llevaremos a tu contenido.</p>
      </div>
    </main>
  );
}

export default function QrLoginPage() {
  return (
    <Suspense>
      <QrLoginClient />
    </Suspense>
  );
}
