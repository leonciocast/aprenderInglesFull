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
    <main className="student-dashboard">
      <div className="student-layout">
        <aside className="student-sidebar">
          <div className="student-sidebar__section">
            <div className="student-sidebar__eyebrow">Welcome</div>
            <h3 className="student-sidebar__title">Student Menu</h3>
            <ul className="student-sidebar__list">
              <li>
                <button type="button" onClick={() => router.push('/courses')}>
                  <span className="student-sidebar__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path
                        d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-5H9v5H5a1 1 0 0 1-1-1v-8Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      />
                    </svg>
                  </span>
                  Dashboard
                </button>
              </li>
              <li>
                <button type="button" onClick={() => router.push('/courses')}>
                  <span className="student-sidebar__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path
                        d="M4 6.5L12 3l8 3.5-8 3.5L4 6.5Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      />
                      <path
                        d="M6 10.5V16c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-5.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      />
                    </svg>
                  </span>
                  Enrolled Courses
                </button>
              </li>
              <li>
                <button type="button" onClick={() => router.push('/quiz')}>
                  <span className="student-sidebar__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path
                        d="M7 3h10a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2V5a2 2 0 0 1 2-2Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      />
                      <path
                        d="M8 9h8M8 13h5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  My Quiz
                </button>
              </li>
            </ul>
          </div>

          <div className="student-sidebar__section">
            <div className="student-sidebar__eyebrow">User</div>
            <ul className="student-sidebar__list">
              <li>
                <button type="button" onClick={() => router.push('/auth/register')}>
                  <span className="student-sidebar__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path
                        d="M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      />
                      <path
                        d="M4.5 12l2.1-.7.6-1.4-1.2-1.9 2-2 1.9 1.2 1.4-.6.7-2.1h2.8l.7 2.1 1.4.6 1.9-1.2 2 2-1.2 1.9.6 1.4 2.1.7v2.8l-2.1.7-.6 1.4 1.2 1.9-2 2-1.9-1.2-1.4.6-.7 2.1h-2.8l-.7-2.1-1.4-.6-1.9 1.2-2-2 1.2-1.9-.6-1.4-2.1-.7Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  Settings
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    fetch('/uploader/api/auth/logout', { method: 'POST' }).finally(() => {
                      router.replace('/auth/login');
                    });
                  }}
                >
                  <span className="student-sidebar__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path
                        d="M10 5h-4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      />
                      <path
                        d="M15 17l4-5-4-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M19 12H9"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </aside>

        <div className="student-content">
          <section className="student-panel">
            <div className="student-panel__header">
              <div>
                <div className="ui-tag" style={{ marginBottom: 8 }}>
                  Recurso especial
                </div>
                <h1 style={{ fontSize: 28, marginBottom: 6 }}>Descarga tu PDF</h1>
                <p className="ui-muted">
                  Aquí tienes “{PDF_FILENAME}”. Haz clic para abrir o descargar el archivo.
                </p>
              </div>
              <a className="ui-button ui-button-primary" href={downloadUrl}>
                Descargar PDF
              </a>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
