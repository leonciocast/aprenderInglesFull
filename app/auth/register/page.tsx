'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = useMemo(
    () => searchParams.get('next') || '/courses',
    [searchParams],
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');

  const toFriendlyError = (value: string) => {
    const text = value.toLowerCase();
    if (text.includes('pattern')) {
      return 'Formato inválido. Usa un correo válido y una contraseña de mínimo 8 caracteres.';
    }
    if (text.includes('correo') || text.includes('contraseña')) {
      return value;
    }
    return 'No pudimos crear tu cuenta. Revisa tus datos e inténtalo de nuevo.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setMessage('');
      setHint('');
      const res = await fetch('/uploader/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, next: nextParam }),
      });
      const data = await res.json();
      if (!res.ok) {
        setHint(data?.hint || data?.pattern || '');
        throw new Error(data.error || 'Registration failed');
      }
      setMessage('Revisa tu correo para verificar tu cuenta.');
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
        <span className="auth-pill">Nuevo acceso</span>
        <h1>Crear cuenta</h1>
        <p className="auth-subtitle">Regístrate para acceder a tus cursos.</p>

        <input
          type="text"
          placeholder="Nombre"
          value={name}
          onChange={e => setName(e.target.value)}
          className="auth-input"
        />
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="auth-input"
        />
        <div className="auth-help">Usa un correo válido, por ejemplo: nombre@dominio.com</div>
        <input
          type="password"
          placeholder="Contraseña (mín. 8)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="auth-input"
        />
        <div className="auth-help">Mínimo 8 caracteres.</div>

        {error && <div className="auth-error">{error}</div>}
        {hint && <div className="auth-hint">{hint}</div>}
        {message && <div className="auth-success">{message}</div>}

        <button
          type="submit"
          disabled={loading}
          className="auth-submit"
        >
          {loading ? 'Enviando…' : 'Crear cuenta'}
        </button>

        <button
          type="button"
          onClick={() =>
            router.push(
              `/auth/login${nextParam ? `?next=${encodeURIComponent(nextParam)}` : ''}`,
            )
          }
          className="auth-secondary auth-secondary--full"
        >
          Ya tengo cuenta
        </button>
      </form>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
