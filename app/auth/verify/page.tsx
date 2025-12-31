'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Token inválido.');
      return;
    }

    fetch(`/uploader/api/auth/verify?token=${encodeURIComponent(token)}`)
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Verification failed');
        setStatus('ok');
        setMessage('Cuenta verificada. Ya puedes iniciar sesión.');
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.message || String(err));
      });
  }, [searchParams]);

  return (
    <main className="ui-shell ui-shell--light" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        className="ui-card ui-card--glass"
        style={{ width: '100%', maxWidth: 420, padding: 28, textAlign: 'center' }}
      >
        <span className="ui-tag" style={{ marginBottom: 10, display: 'inline-flex' }}>Verificación</span>
        <h1 style={{ fontSize: 24, marginBottom: 10 }}>
          {status === 'loading' ? 'Verificando…' : 'Verificación'}
        </h1>
        <p className={status === 'error' ? undefined : 'ui-muted'} style={{ color: status === 'error' ? '#f87171' : undefined }}>
          {message}
        </p>
        {status === 'ok' && (
          <button
            type="button"
            onClick={() => router.push('/auth/login')}
            className="ui-button ui-button-primary"
            style={{ marginTop: 16 }}
          >
            Ir a iniciar sesión
          </button>
        )}
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <main
          className="ui-shell ui-shell--light"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          Verificando…
        </main>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
