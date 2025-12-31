'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Course = {
  id: number;
  title: string;
  description?: string;
  cover_image_url?: string;
};

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    <main className="ui-shell ui-shell--light">
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div className="ui-tag" style={{ marginBottom: 8 }}>
            Panel del estudiante
          </div>
          <h1 style={{ fontSize: 30, marginBottom: 6 }}>
            {userName ? `Hola, ${userName}` : 'Mis cursos'}
          </h1>
          <p className="ui-muted">Accede a tus lecciones asignadas.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            fetch('/uploader/api/auth/logout', { method: 'POST' }).finally(() => {
              router.replace('/auth/login');
            });
          }}
          className="ui-button ui-button-outline"
        >
          Cerrar sesión
        </button>
      </header>

      <section className="courses-hero">
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
            Tu progreso empieza aquí
          </div>
          <div className="ui-muted" style={{ maxWidth: 560 }}>
            Encuentra tus cursos activos y continúa aprendiendo con tus lecciones.
          </div>
        </div>
        <button type="button" className="ui-button ui-button-primary">
          Empezar ahora
        </button>
      </section>

      {loading && <p>Cargando cursos…</p>}
      {error && <p style={{ color: '#f87171' }}>{error}</p>}

      <div className="courses-grid">
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
    </main>
  );
}
