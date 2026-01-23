'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PrincipiantesPage() {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const meRes = await fetch('/uploader/api/auth/me');
        if (!meRes.ok) {
          router.replace(`/auth/login?next=${encodeURIComponent('/principiantes')}`);
          return;
        }
        setAuthReady(true);
      } catch {
        router.replace(`/auth/login?next=${encodeURIComponent('/principiantes')}`);
      }
    };
    void checkAuth();
  }, [router]);

  if (!authReady) {
    return (
      <main className="auth-page ui-shell ui-shell--light">
        <div className="auth-card ui-card">
          <span className="auth-pill">Validando</span>
          <h1>Revisando tu acceso…</h1>
          <p className="auth-subtitle">Un momento por favor.</p>
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
                  Principiantes
                </div>
                <h1 style={{ fontSize: 28, marginBottom: 6 }}>
                  Libro de juegos básicos
                </h1>
                <p className="ui-muted">
                  Cada capítulo es un juego corto para practicar vocabulario.
                </p>
              </div>
            </div>
          </section>

          <section className="quiz-grid">
            <div className="quiz-card quiz-card--summary">
              <div className="quiz-card__body">
                <div className="quiz-card__title">
                  <h3>Emociones</h3>
                </div>
                <div className="quiz-card__row">
                  <strong>9 tarjetas</strong>
                </div>
                <div className="quiz-card__row">
                  <strong>Adivina la emoción correcta</strong>
                </div>
                <div className="quiz-card__row">
                  <button
                    type="button"
                    className="ui-button ui-button-primary"
                    onClick={() => router.push('/principiantes/emociones')}
                  >
                    Empezar
                  </button>
                </div>
              </div>
            </div>
            <div className="quiz-card quiz-card--summary">
              <div className="quiz-card__body">
                <div className="quiz-card__title">
                  <h3>Partes del cuerpo</h3>
                </div>
                <div className="quiz-card__row">
                  <strong>8 tarjetas</strong>
                </div>
                <div className="quiz-card__row">
                  <strong>Identifica la parte correcta</strong>
                </div>
                <div className="quiz-card__row">
                  <button
                    type="button"
                    className="ui-button ui-button-primary"
                    onClick={() => router.push('/principiantes/bodyparts')}
                  >
                    Empezar
                  </button>
                </div>
              </div>
            </div>
            <div className="quiz-card quiz-card--summary">
              <div className="quiz-card__body">
                <div className="quiz-card__title">
                  <h3>Cocina</h3>
                </div>
                <div className="quiz-card__row">
                  <strong>12 tarjetas</strong>
                </div>
                <div className="quiz-card__row">
                  <strong>Elige el utensilio correcto</strong>
                </div>
                <div className="quiz-card__row">
                  <button
                    type="button"
                    className="ui-button ui-button-primary"
                    onClick={() => router.push('/principiantes/cocina')}
                  >
                    Empezar
                  </button>
                </div>
              </div>
            </div>
            <div className="quiz-card quiz-card--summary">
              <div className="quiz-card__body">
                <div className="quiz-card__title">
                  <h3>Baño</h3>
                </div>
                <div className="quiz-card__row">
                  <strong>9 tarjetas</strong>
                </div>
                <div className="quiz-card__row">
                  <strong>Elige el objeto correcto</strong>
                </div>
                <div className="quiz-card__row">
                  <button
                    type="button"
                    className="ui-button ui-button-primary"
                    onClick={() => router.push('/principiantes/bathroom')}
                  >
                    Empezar
                  </button>
                </div>
              </div>
            </div>
            <div className="quiz-card quiz-card--summary">
              <div className="quiz-card__body">
                <div className="quiz-card__title">
                  <h3>Dormitorio</h3>
                </div>
                <div className="quiz-card__row">
                  <strong>9 tarjetas</strong>
                </div>
                <div className="quiz-card__row">
                  <strong>Elige el objeto correcto</strong>
                </div>
                <div className="quiz-card__row">
                  <button
                    type="button"
                    className="ui-button ui-button-primary"
                    onClick={() => router.push('/principiantes/bedroom')}
                  >
                    Empezar
                  </button>
                </div>
              </div>
            </div>
            <div className="quiz-card quiz-card--summary">
              <div className="quiz-card__body">
                <div className="quiz-card__title">
                  <h3>Números</h3>
                </div>
                <div className="quiz-card__row">
                  <strong>14 tarjetas</strong>
                </div>
                <div className="quiz-card__row">
                  <strong>Elige el número correcto</strong>
                </div>
                <div className="quiz-card__row">
                  <button
                    type="button"
                    className="ui-button ui-button-primary"
                    onClick={() => router.push('/principiantes/numeros')}
                  >
                    Empezar
                  </button>
                </div>
              </div>
            </div>
            <div className="quiz-card quiz-card--summary">
              <div className="quiz-card__body">
                <div className="quiz-card__title">
                  <h3>Días de la semana</h3>
                </div>
                <div className="quiz-card__row">
                  <strong>7 tarjetas</strong>
                </div>
                <div className="quiz-card__row">
                  <strong>Elige el día correcto</strong>
                </div>
                <div className="quiz-card__row">
                  <button
                    type="button"
                    className="ui-button ui-button-primary"
                    onClick={() => router.push('/principiantes/dias')}
                  >
                    Empezar
                  </button>
                </div>
              </div>
            </div>
            <div className="quiz-card quiz-card--summary">
              <div className="quiz-card__body">
                <div className="quiz-card__title">
                  <h3>Meses</h3>
                </div>
                <div className="quiz-card__row">
                  <strong>12 tarjetas</strong>
                </div>
                <div className="quiz-card__row">
                  <strong>Elige el mes correcto</strong>
                </div>
                <div className="quiz-card__row">
                  <button
                    type="button"
                    className="ui-button ui-button-primary"
                    onClick={() => router.push('/principiantes/meses')}
                  >
                    Empezar
                  </button>
                </div>
              </div>
            </div>
            <div className="quiz-card quiz-card--summary">
              <div className="quiz-card__body">
                <div className="quiz-card__title">
                  <h3>Números ordinales</h3>
                </div>
                <div className="quiz-card__row">
                  <strong>21 tarjetas</strong>
                </div>
                <div className="quiz-card__row">
                  <strong>Elige el ordinal correcto</strong>
                </div>
                <div className="quiz-card__row">
                  <button
                    type="button"
                    className="ui-button ui-button-primary"
                    onClick={() => router.push('/principiantes/ordinales')}
                  >
                    Empezar
                  </button>
                </div>
              </div>
            </div>
            <div className="quiz-card quiz-card--summary">
              <div className="quiz-card__body">
                <div className="quiz-card__title">
                  <h3>Transporte</h3>
                </div>
                <div className="quiz-card__row">
                  <strong>9 tarjetas</strong>
                </div>
                <div className="quiz-card__row">
                  <strong>Elige el transporte correcto</strong>
                </div>
                <div className="quiz-card__row">
                  <button
                    type="button"
                    className="ui-button ui-button-primary"
                    onClick={() => router.push('/principiantes/transporte')}
                  >
                    Empezar
                  </button>
                </div>
              </div>
            </div>
            <div className="quiz-card quiz-card--summary">
              <div className="quiz-card__body">
                <div className="quiz-card__title">
                  <h3>Lugares</h3>
                </div>
                <div className="quiz-card__row">
                  <strong>9 tarjetas</strong>
                </div>
                <div className="quiz-card__row">
                  <strong>Elige el lugar correcto</strong>
                </div>
                <div className="quiz-card__row">
                  <button
                    type="button"
                    className="ui-button ui-button-primary"
                    onClick={() => router.push('/principiantes/lugares')}
                  >
                    Empezar
                  </button>
                </div>
              </div>
            </div>
            <div className="quiz-card quiz-card--summary">
              <div className="quiz-card__body">
                <div className="quiz-card__title">
                  <h3>Actividades</h3>
                </div>
                <div className="quiz-card__row">
                  <strong>9 tarjetas</strong>
                </div>
                <div className="quiz-card__row">
                  <strong>Elige la actividad correcta</strong>
                </div>
                <div className="quiz-card__row">
                  <button
                    type="button"
                    className="ui-button ui-button-primary"
                    onClick={() => router.push('/principiantes/actividades')}
                  >
                    Empezar
                  </button>
                </div>
              </div>
            </div>
            <div className="quiz-card quiz-card--summary">
              <div className="quiz-card__body">
                <div className="quiz-card__title">
                  <h3>Colores</h3>
                </div>
                <div className="quiz-card__row">
                  <strong>9 tarjetas</strong>
                </div>
                <div className="quiz-card__row">
                  <strong>Elige el color correcto</strong>
                </div>
                <div className="quiz-card__row">
                  <button
                    type="button"
                    className="ui-button ui-button-primary"
                    onClick={() => router.push('/principiantes/colores')}
                  >
                    Empezar
                  </button>
                </div>
              </div>
            </div>
            <div className="quiz-card quiz-card--summary">
              <div className="quiz-card__body">
                <div className="quiz-card__title">
                  <h3>Frutas</h3>
                </div>
                <div className="quiz-card__row">
                  <strong>9 tarjetas</strong>
                </div>
                <div className="quiz-card__row">
                  <strong>Elige la fruta correcta</strong>
                </div>
                <div className="quiz-card__row">
                  <button
                    type="button"
                    className="ui-button ui-button-primary"
                    onClick={() => router.push('/principiantes/frutas')}
                  >
                    Empezar
                  </button>
                </div>
              </div>
            </div>
            <div className="quiz-card quiz-card--summary">
              <div className="quiz-card__body">
                <div className="quiz-card__title">
                  <h3>Comida</h3>
                </div>
                <div className="quiz-card__row">
                  <strong>9 tarjetas</strong>
                </div>
                <div className="quiz-card__row">
                  <strong>Elige la comida correcta</strong>
                </div>
                <div className="quiz-card__row">
                  <button
                    type="button"
                    className="ui-button ui-button-primary"
                    onClick={() => router.push('/principiantes/comida')}
                  >
                    Empezar
                  </button>
                </div>
              </div>
            </div>
            <div className="quiz-card quiz-card--summary">
              <div className="quiz-card__body">
                <div className="quiz-card__title">
                  <h3>Ropa</h3>
                </div>
                <div className="quiz-card__row">
                  <strong>9 tarjetas</strong>
                </div>
                <div className="quiz-card__row">
                  <strong>Elige la prenda correcta</strong>
                </div>
                <div className="quiz-card__row">
                  <button
                    type="button"
                    className="ui-button ui-button-primary"
                    onClick={() => router.push('/principiantes/ropa')}
                  >
                    Empezar
                  </button>
                </div>
              </div>
            </div>
            <div className="quiz-card quiz-card--summary">
              <div className="quiz-card__body">
                <div className="quiz-card__title">
                  <h3>Clima</h3>
                </div>
                <div className="quiz-card__row">
                  <strong>9 tarjetas</strong>
                </div>
                <div className="quiz-card__row">
                  <strong>Elige el clima correcto</strong>
                </div>
                <div className="quiz-card__row">
                  <button
                    type="button"
                    className="ui-button ui-button-primary"
                    onClick={() => router.push('/principiantes/clima')}
                  >
                    Empezar
                  </button>
                </div>
              </div>
            </div>
            <div className="quiz-card quiz-card--summary">
              <div className="quiz-card__body">
                <div className="quiz-card__title">
                  <h3>Hotel</h3>
                </div>
                <div className="quiz-card__row">
                  <strong>9 tarjetas</strong>
                </div>
                <div className="quiz-card__row">
                  <strong>Elige la palabra correcta</strong>
                </div>
                <div className="quiz-card__row">
                  <button
                    type="button"
                    className="ui-button ui-button-primary"
                    onClick={() => router.push('/principiantes/hotel')}
                  >
                    Empezar
                  </button>
                </div>
              </div>
            </div>
            <div className="quiz-card quiz-card--summary">
              <div className="quiz-card__body">
                <div className="quiz-card__title">
                  <h3>Aeropuerto</h3>
                </div>
                <div className="quiz-card__row">
                  <strong>6 tarjetas</strong>
                </div>
                <div className="quiz-card__row">
                  <strong>Elige la palabra correcta</strong>
                </div>
                <div className="quiz-card__row">
                  <button
                    type="button"
                    className="ui-button ui-button-primary"
                    onClick={() => router.push('/principiantes/aeropuerto')}
                  >
                    Empezar
                  </button>
                </div>
              </div>
            </div>
            <div className="quiz-card quiz-card--summary">
              <div className="quiz-card__body">
                <div className="quiz-card__title">
                  <h3>Deportes</h3>
                </div>
                <div className="quiz-card__row">
                  <strong>9 tarjetas</strong>
                </div>
                <div className="quiz-card__row">
                  <strong>Elige el deporte correcto</strong>
                </div>
                <div className="quiz-card__row">
                  <button
                    type="button"
                    className="ui-button ui-button-primary"
                    onClick={() => router.push('/principiantes/deportes')}
                  >
                    Empezar
                  </button>
                </div>
              </div>
            </div>
            <div className="quiz-card quiz-card--summary">
              <div className="quiz-card__body">
                <div className="quiz-card__title">
                  <h3>Familia</h3>
                </div>
                <div className="quiz-card__row">
                  <strong>9 tarjetas</strong>
                </div>
                <div className="quiz-card__row">
                  <strong>Elige el familiar correcto</strong>
                </div>
                <div className="quiz-card__row">
                  <button
                    type="button"
                    className="ui-button ui-button-primary"
                    onClick={() => router.push('/principiantes/familia')}
                  >
                    Empezar
                  </button>
                </div>
              </div>
            </div>
            <div className="quiz-card quiz-card--summary">
              <div className="quiz-card__body">
                <div className="quiz-card__title">
                  <h3>Enfermedades</h3>
                </div>
                <div className="quiz-card__row">
                  <strong>9 tarjetas</strong>
                </div>
                <div className="quiz-card__row">
                  <strong>Elige la palabra correcta</strong>
                </div>
                <div className="quiz-card__row">
                  <button
                    type="button"
                    className="ui-button ui-button-primary"
                    onClick={() => router.push('/principiantes/enfermedades')}
                  >
                    Empezar
                  </button>
                </div>
              </div>
            </div>
            <div className="quiz-card quiz-card--summary">
              <div className="quiz-card__body">
                <div className="quiz-card__title">
                  <h3>Países</h3>
                </div>
                <div className="quiz-card__row">
                  <strong>9 tarjetas</strong>
                </div>
                <div className="quiz-card__row">
                  <strong>Elige el país correcto</strong>
                </div>
                <div className="quiz-card__row">
                  <button
                    type="button"
                    className="ui-button ui-button-primary"
                    onClick={() => router.push('/principiantes/paises')}
                  >
                    Empezar
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
