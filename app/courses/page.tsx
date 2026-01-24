'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Course = {
  id: number;
  title: string;
  description?: string;
  cover_image_url?: string;
  lesson_count?: number;
  progress_percent?: number | string;
};

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const stats = useMemo(
    () => [
      {
        label: 'Enrolled Courses',
        value: courses.length,
        tone: 'blue',
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M3.5 6.5L12 3l8.5 3.5-8.5 3.5L3.5 6.5Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M5.5 9.8V16c0 1.7 3.3 3 6.5 3s6.5-1.3 6.5-3V9.8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            />
          </svg>
        ),
      },
      {
        label: 'Active Courses',
        value: courses.length,
        tone: 'lilac',
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect
              x="4"
              y="5"
              width="16"
              height="12"
              rx="2.2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M8 19h8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
      {
        label: 'Completed Courses',
        value: 0,
        tone: 'violet',
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle
              cx="12"
              cy="9"
              r="4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M7 21l5-3 5 3V16.5a4.5 4.5 0 0 0-9 0V21Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            />
          </svg>
        ),
      },
    ],
    [courses.length],
  );

  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await fetch('/uploader/api/auth/me');
        if (!meRes.ok) {
          router.replace('/auth/login');
          return;
        }
        const meData = await meRes.json();
        setUserName(meData?.user?.name || meData?.user?.email || '');
        const res = await fetch('/uploader/api/courses');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load courses');
        setCourses(data.courses || []);
      } catch (err: any) {
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router]);

  return (
    <main className="student-dashboard">
      <section className="student-hero">
        <div className="student-hero__glow" aria-hidden="true" />
        <div className="student-hero__card">
          <div className="student-hero__profile">
            <div className="student-hero__avatar">
              {userName ? userName.slice(0, 2).toUpperCase() : 'ST'}
            </div>
            <div>
              <div className="student-hero__name">
                {userName ? `Hola, ${userName}` : 'Panel del estudiante'}
              </div>
              <div className="student-hero__meta">
                <span>📘 {courses.length} cursos</span>
                <span>🏅 0 certificados</span>
              </div>
            </div>
          </div>
          <div className="student-hero__spacer" aria-hidden="true" />
        </div>
      </section>

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
                  Panel del estudiante
                </div>
                <h1 style={{ fontSize: 28, marginBottom: 6 }}>
                  Tu progreso empieza aquí
                </h1>
                <p className="ui-muted">
                  Encuentra tus cursos activos y continúa aprendiendo con tus lecciones.
                </p>
              </div>
              <button type="button" className="ui-button ui-button-primary">
                Empezar ahora
              </button>
            </div>
          </section>

          <section className="student-panel">
            <div className="student-panel__header">
              <h2>Dashboard</h2>
              <span className="student-panel__meta">Resumen</span>
            </div>
            <div className="student-stats">
              {stats.map(card => (
                <div key={card.label} className={`student-stat student-stat--${card.tone}`}>
                  <div className="student-stat__icon" aria-hidden="true">
                    {card.icon}
                  </div>
                  <div className="student-stat__value">{card.value}</div>
                  <div className="student-stat__label">{card.label}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="student-panel">
            <div className="student-panel__header">
              <h2>My Courses</h2>
              <span className="student-panel__meta">Accesos directos</span>
            </div>
            {loading && <p>Cargando cursos…</p>}
            {error && <p style={{ color: '#f87171' }}>{error}</p>}
            <div className="courses-grid">
              <button
                type="button"
                onClick={() => router.push('/principiantes')}
                className="course-card"
              >
                <div className="course-thumb">
                  <span>Libro</span>
                </div>
                <div className="course-meta">Libro</div>
                <div className="course-title">Principiantes</div>
                <div className="course-desc">
                  Juegos y capítulos interactivos para empezar desde cero.
                </div>
                <div className="course-footer">
                  <span>Abrir</span>
                  <span>→</span>
                </div>
              </button>
              {courses.map(course => (
                <button
                  key={course.id}
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch(`/uploader/api/courses/${course.id}`);
                      const data = await res.json();
                      if (res.status === 401) {
                        router.replace('/auth/login');
                        return;
                      }
                      const firstLesson = (data.lessons || [])[0];
                      if (firstLesson?.id) {
                        router.push(`/courses/${course.id}/lessons/${firstLesson.id}`);
                        return;
                      }
                    } catch (err) {
                      console.error('Course navigation error:', err);
                    }
                    router.push(`/courses/${course.id}`);
                  }}
                  className="course-card"
                >
            <div className="course-thumb">
              {course.cover_image_url ? (
                <img src={course.cover_image_url} alt={course.title} />
              ) : (
                <span>Curso</span>
              )}
              <div
                className="course-progress"
                style={{
                  ['--progress' as any]: `${Math.round(Number(course.progress_percent || 0))}%`,
                }}
              >
                <span>{Math.round(Number(course.progress_percent || 0))}%</span>
              </div>
            </div>
                  <div className="course-meta">Curso</div>
                  <div className="course-title">{course.title}</div>
                  {course.description && (
                    <div className="course-desc">{course.description}</div>
                  )}
                  <div className="course-footer">
                    <span>Ver lecciones</span>
                    <span>→</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="student-favicon" aria-hidden="true">
        <img src="https://cdn.aprenderinglesfull.com/icons/favicon.svg" alt="" />
      </div>
    </main>
  );
}
