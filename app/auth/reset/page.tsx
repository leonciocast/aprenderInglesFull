'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = searchParams.get('token') || '';
    setToken(t);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setMessage('');
      const res = await fetch('/uploader/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      setMessage('Contraseña actualizada. Inicia sesión.');
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="ui-shell ui-shell--light" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form
        onSubmit={handleSubmit}
        className="ui-card ui-card--glass"
        style={{ width: '100%', maxWidth: 420, padding: 28 }}
      >
        <span className="ui-tag" style={{ marginBottom: 10 }}>Restablecer</span>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Nueva contraseña</h1>
        <p className="ui-muted" style={{ marginBottom: 16 }}>
          Ingresa tu nueva contraseña.
        </p>
        <input
          type="password"
          placeholder="Contraseña (mín. 8)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="ui-input"
          style={{ marginBottom: 14 }}
        />

        {error && <div style={{ color: '#f87171', marginBottom: 10 }}>{error}</div>}
        {message && <div style={{ color: '#34d399', marginBottom: 10 }}>{message}</div>}

        <button
          type="submit"
          disabled={loading || !token}
          className="ui-button ui-button-primary"
          style={{ width: '100%' }}
        >
          {loading ? 'Guardando…' : 'Guardar contraseña'}
        </button>

        <button
          type="button"
          onClick={() => router.push('/auth/login')}
          className="ui-button ui-button-outline"
          style={{ marginTop: 12, width: '100%' }}
        >
          Ir a iniciar sesión
        </button>
      </form>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main
          className="ui-shell ui-shell--light"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          Cargando…
        </main>
      }
    >
      <ResetContent />
    </Suspense>
  );
}
