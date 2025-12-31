'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
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
        body: JSON.stringify({ name, email, password }),
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
    <main className="ui-shell ui-shell--light" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form
        onSubmit={handleSubmit}
        className="ui-card ui-card--glass"
        style={{ width: '100%', maxWidth: 420, padding: 28 }}
      >
        <span className="ui-tag" style={{ marginBottom: 10 }}>Nuevo acceso</span>
        <h1 style={{ fontSize: 26, marginBottom: 6 }}>Crear cuenta</h1>
        <p className="ui-muted" style={{ marginBottom: 16 }}>
          Regístrate para acceder a tus cursos.
        </p>

        <input
          type="text"
          placeholder="Nombre"
          value={name}
          onChange={e => setName(e.target.value)}
          className="ui-input"
          style={{ marginBottom: 10 }}
        />
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="ui-input"
          style={{ marginBottom: 10 }}
        />
        <div className="ui-muted" style={{ fontSize: 12, marginBottom: 12 }}>
          Usa un correo válido, por ejemplo: nombre@dominio.com
        </div>
        <input
          type="password"
          placeholder="Contraseña (mín. 8)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="ui-input"
          style={{ marginBottom: 6 }}
        />
        <div className="ui-muted" style={{ fontSize: 12, marginBottom: 14 }}>
          Mínimo 8 caracteres.
        </div>

        {error && <div style={{ color: '#f87171', marginBottom: 6 }}>{error}</div>}
        {hint && <div style={{ color: '#fbbf24', marginBottom: 10 }}>{hint}</div>}
        {message && <div style={{ color: '#34d399', marginBottom: 10 }}>{message}</div>}

        <button
          type="submit"
          disabled={loading}
          className="ui-button ui-button-primary"
          style={{ width: '100%' }}
        >
          {loading ? 'Enviando…' : 'Crear cuenta'}
        </button>

        <button
          type="button"
          onClick={() => router.push('/auth/login')}
          className="ui-button ui-button-outline"
          style={{ marginTop: 12, width: '100%' }}
        >
          Ya tengo cuenta
        </button>
      </form>
    </main>
  );
}
