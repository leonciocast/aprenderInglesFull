'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
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
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setHint(data?.hint || '');
        throw new Error(data.error || 'Login failed');
      }
      router.push('/courses');
    } catch (err: any) {
      setError(toFriendlyError(err.message || String(err)));
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
        <span className="ui-tag" style={{ marginBottom: 10 }}>Bienvenido</span>
        <h1 style={{ fontSize: 26, marginBottom: 6 }}>Iniciar sesión</h1>
        <p className="ui-muted" style={{ marginBottom: 16 }}>Accede a tus cursos.</p>

        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="ui-input"
          style={{ marginBottom: 10 }}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="ui-input"
          style={{ marginBottom: 14 }}
        />

        {error && <div style={{ color: '#f87171', marginBottom: 6 }}>{error}</div>}
        {hint && <div style={{ color: '#f59e0b', marginBottom: 10 }}>{hint}</div>}

        <button
          type="submit"
          disabled={loading}
          className="ui-button ui-button-primary"
          style={{ width: '100%' }}
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>

        <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={() => router.push('/auth/register')}
            className="ui-button ui-button-outline"
            style={{ flex: 1 }}
          >
            Crear cuenta
          </button>
          <button
            type="button"
            onClick={() => router.push('/auth/forgot')}
            className="ui-button ui-button-outline"
            style={{ flex: 1 }}
          >
            Olvidé mi clave
          </button>
        </div>
      </form>
    </main>
  );
}
