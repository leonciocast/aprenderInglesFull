'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Quiz = {
  id: number;
  title: string;
  description?: string;
  course_title?: string | null;
  lesson_title?: string | null;
};

export default function QuizListPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/uploader/api/quizzes');
        const data = await res.json();
        if (res.status === 401) {
          router.replace(`/auth/login?next=${encodeURIComponent('/quiz')}`);
          return;
        }
        if (!res.ok) throw new Error(data.error || 'Failed to load quizzes');
        setQuizzes(data.quizzes || []);
      } catch (err: any) {
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  return (
    <main className="ui-shell ui-shell--light">
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div className="ui-tag" style={{ marginBottom: 8 }}>My Quiz</div>
        <h1 style={{ fontSize: 28, marginBottom: 8, color: '#192335' }}>Quizzes</h1>
        <p className="ui-muted" style={{ marginBottom: 16 }}>
          Selecciona un quiz para comenzar.
        </p>

        {loading && <p>Cargando quizzes…</p>}
        {error && <p style={{ color: '#f87171' }}>{error}</p>}

        <div className="quiz-grid">
          {quizzes.map(quiz => (
            <div key={quiz.id} className="quiz-card quiz-card--summary">
              <div className="quiz-card__body">
                <div className="quiz-card__title">
                  <h3>{quiz.title}</h3>
                </div>
                <div className="quiz-card__row">
                  <span>Curso</span>
                  <strong>{quiz.course_title || '—'}</strong>
                </div>
                <div className="quiz-card__row">
                  <span>Lección</span>
                  <strong>{quiz.lesson_title || '—'}</strong>
                </div>
                {quiz.description && (
                  <div className="quiz-card__row">
                    <span>Descripción</span>
                    <strong>{quiz.description}</strong>
                  </div>
                )}
              </div>
              <button
                type="button"
                className="ui-button ui-button-primary"
                onClick={() => router.push(`/quiz/${quiz.id}`)}
              >
                Empezar
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
