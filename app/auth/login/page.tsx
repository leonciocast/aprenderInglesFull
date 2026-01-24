'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = useMemo(() => searchParams.get('next') || '', [searchParams]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');

  const toFriendlyError = (value: string) => {
    const text = value.toLowerCase();
    if (text.includes('pattern')) {
      return 'Formato inválido. Usa un correo válido y una contraseña de mínimo 8 caracteres.';
    }
    if (
      text.includes('correo') ||
      text.includes('contraseña') ||
      text.includes('verificado')
    ) {
      return value;
    }
    return 'No pudimos iniciar sesión. Revisa tus datos e inténtalo de nuevo.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setHint('');
      const res = await fetch('/uploader/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setHint(data?.hint || '');
        throw new Error(data.error || 'Login failed');
      }
      const safeNext =
        nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '';
      router.push(safeNext || '/courses');
    } catch (err: any) {
      setError(toFriendlyError(err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page ui-shell ui-shell--light">
      <form
        onSubmit={handleSubmit}
        className="auth-card ui-card"
      >
        <span className="auth-pill">Bienvenido</span>
        <h1>Iniciar sesión</h1>
        <p className="auth-subtitle">Accede a tus cursos.</p>

        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="auth-input"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="auth-input"
        />

        {error && <div className="auth-error">{error}</div>}
        {hint && <div className="auth-hint">{hint}</div>}

        <button
          type="submit"
          disabled={loading}
          className="auth-submit"
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>

        <div className="auth-actions">
          <button
            type="button"
            onClick={() =>
              router.push(
                `/auth/register${nextParam ? `?next=${encodeURIComponent(nextParam)}` : ''}`,
              )
            }
            className="auth-secondary"
          >
            Crear cuenta
          </button>
          <button
            type="button"
            onClick={() => router.push('/auth/forgot')}
            className="auth-secondary"
          >
            Olvidé mi clave
          </button>
        </div>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
