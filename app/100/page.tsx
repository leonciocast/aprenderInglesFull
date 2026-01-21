'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const PDF_FILENAME = 'Las 100 frases más comunes en inglés.pdf';

export default function HundredPhrasesPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  const [error, setError] = useState('');

  const downloadUrl = useMemo(
    () => `/uploader/api/pdfs/download?file=${encodeURIComponent(PDF_FILENAME)}`,
    [],
  );

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const meRes = await fetch('/uploader/api/auth/me');
        if (!meRes.ok) {
          router.replace(`/auth/login?next=${encodeURIComponent('/100')}`);
          return;
        }
        setStatus('ready');
      } catch (err: any) {
        setError(err?.message || String(err));
        setStatus('error');
      }
    };
    void checkAuth();
  }, [router]);

  if (status === 'checking') {
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
            onClick={() => router.replace(`/auth/login?next=${encodeURIComponent('/100')}`)}
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
        <span className="auth-pill">Recurso especial</span>
        <h1>Descarga tu PDF</h1>
        <p className="auth-subtitle">
          Aquí tienes “{PDF_FILENAME}”. Haz clic para abrir o descargar el archivo.
        </p>
        <a className="auth-submit" href={downloadUrl}>
          Descargar PDF
        </a>
      </div>
    </main>
  );
}
