'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type Lesson = {
  id: number;
  title: string;
  lesson_order: number;
};

type Course = {
  id: number;
  title: string;
  description?: string;
  cover_image_url?: string;
};

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = Number(params.courseId);
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!Number.isFinite(courseId)) return;
    const load = async () => {
      try {
        const res = await fetch(`/uploader/api/courses/${courseId}`);
        const data = await res.json();
        if (res.status === 401) {
          router.replace('/auth/login');
          return;
        }
        if (!res.ok) throw new Error(data.error || 'Failed to load course');
        setCourse(data.course);
        setLessons(data.lessons || []);
        if ((data.lessons || []).length > 0) {
          const firstLesson = data.lessons[0];
          if (firstLesson?.id) {
            router.replace(`/courses/${courseId}/lessons/${firstLesson.id}`);
          }
        }
      } catch (err: any) {
        setError(err.message || String(err));
      }
    };
    load();
  }, [courseId]);

  if (!Number.isFinite(courseId)) {
    return <div>Invalid course</div>;
  }

  return (
    <main className="ui-shell ui-shell--light">
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <button
        type="button"
        onClick={() => router.push('/courses')}
        className="ui-button ui-button-outline"
        style={{ marginBottom: 16 }}
      >
        ← Volver
      </button>

      {error && <p style={{ color: '#f87171' }}>{error}</p>}

      {course && (
        <>
          <h1 style={{ fontSize: 28, marginBottom: 6, color: '#192335' }}>
            {course.title}
          </h1>
          {course.description && (
            <p className="ui-muted" style={{ marginBottom: 18 }}>
              {course.description}
            </p>
          )}
        </>
      )}

      <section className="ui-card" style={{ padding: 16 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12, color: '#192335' }}>
          Lecciones
        </h2>
        <div className="lesson-list">
          {lessons.map(lesson => (
            <button
              key={lesson.id}
              type="button"
              onClick={() =>
                router.push(`/courses/${courseId}/lessons/${lesson.id}`)
              }
              className="lesson-item"
            >
              <div className="ui-muted" style={{ fontSize: 12, marginBottom: 4 }}>
                Lección {lesson.lesson_order}
              </div>
              <div>{lesson.title}</div>
            </button>
          ))}
        </div>
      </section>
      </div>
    </main>
  );
}
