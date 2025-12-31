'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setMessage('');
      const res = await fetch('/uploader/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setMessage('Si el correo existe, te enviamos un enlace para restablecer.');
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
        <span className="ui-tag" style={{ marginBottom: 10 }}>Recuperación</span>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Recuperar contraseña</h1>
        <p className="ui-muted" style={{ marginBottom: 16 }}>
          Te enviaremos un enlace para restablecerla.
        </p>
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="ui-input"
          style={{ marginBottom: 14 }}
        />

        {error && <div style={{ color: '#f87171', marginBottom: 10 }}>{error}</div>}
        {message && <div style={{ color: '#34d399', marginBottom: 10 }}>{message}</div>}

        <button
          type="submit"
          disabled={loading}
          className="ui-button ui-button-primary"
          style={{ width: '100%' }}
        >
          {loading ? 'Enviando…' : 'Enviar enlace'}
        </button>

        <button
          type="button"
          onClick={() => router.push('/auth/login')}
          className="ui-button ui-button-outline"
          style={{ marginTop: 12, width: '100%' }}
        >
          Volver a iniciar sesión
        </button>
      </form>
    </main>
  );
}
