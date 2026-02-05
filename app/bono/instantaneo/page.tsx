'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchMeWithRefresh } from '@/app/lib/auth-client';

const PDF_FILENAME = 'Inglés Instantáneo.pdf';
const downloadUrl = `/uploader/api/pdfs/download?file=${encodeURIComponent(PDF_FILENAME)}`;

export default function BonoInstantaneoPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const meRes = await fetchMeWithRefresh();
        if (!meRes.ok) {
          router.replace(`/auth/login?next=${encodeURIComponent('/bono/instantaneo')}`);
          return;
        }
        setStatus('ready');
        window.location.assign(downloadUrl);
      } catch (err: any) {
        setError(err?.message || String(err));
        setStatus('error');
      }
    };
    void checkAuth();
  }, [router]);

  if (status === 'error') {
    return (
      <main className="auth-page ui-shell ui-shell--light">
        <div className="auth-card ui-card">
          <span className="auth-pill">Error</span>
          <h1>No pudimos validar tu acceso</h1>
          <p className="auth-subtitle">{error || 'Inténtalo de nuevo más tarde.'}</p>
          <button
            type="button"
            className="auth-submit"
            onClick={() =>
              router.replace(`/auth/login?next=${encodeURIComponent('/bono/instantaneo')}`)
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
        <span className="auth-pill">Preparando</span>
        <h1>Validando tu acceso…</h1>
        <p className="auth-subtitle">Te llevaremos al PDF en un momento.</p>
      </div>
    </main>
  );
}
