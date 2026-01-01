'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type Quiz = {
  id: number;
  title: string;
  description?: string;
  course_title?: string | null;
  lesson_title?: string | null;
};

type QuizOption = {
  id: number;
  text: string;
};

type QuizQuestion = {
  id: number;
  text: string;
  order: number;
  options: QuizOption[];
};

type Attempt = {
  id: number;
  started_at: string;
  finished_at?: string | null;
  score_percent?: number;
  total_correct?: number;
  total_wrong?: number;
};

export default function QuizPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = Number(params.id);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [displayQuestions, setDisplayQuestions] = useState<QuizQuestion[]>([]);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    scorePercent: number;
    totalCorrect: number;
    totalWrong: number;
    totalQuestions: number;
  } | null>(null);
  const [meLabel, setMeLabel] = useState('');
  const [questionResults, setQuestionResults] = useState<Record<number, { correctOptionId: number | null; isCorrect: boolean | null }>>({});

  useEffect(() => {
    if (!Number.isFinite(quizId)) return;
    const init = async () => {
      try {
        setLoading(true);
        const meRes = await fetch('/uploader/api/auth/me');
        const meData = await meRes.json();
        if (meRes.ok) {
          setMeLabel(meData?.user?.name || meData?.user?.email || '');
        }
        const quizRes = await fetch(`/uploader/api/quizzes/${quizId}`);
        const quizData = await quizRes.json();
        if (quizRes.status === 401) {
          router.replace('/auth/login');
          return;
        }
        if (!quizRes.ok) throw new Error(quizData.error || 'Failed to load quiz');
        setQuiz(quizData.quiz);
        setQuestions(quizData.questions || []);

        const attemptRes = await fetch('/uploader/api/quiz-attempts/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quizId }),
        });
        const attemptData = await attemptRes.json();
        if (!attemptRes.ok) throw new Error(attemptData.error || 'Failed to start attempt');
        setAttempt(attemptData.attempt);

        const answered: Record<number, number> = {};
        (attemptData.answers || []).forEach((item: any) => {
          if (item.question_id && item.selected_option_id) {
            answered[Number(item.question_id)] = Number(item.selected_option_id);
          }
        });
        setAnswers(answered);
      } catch (err: any) {
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [quizId, router]);

  const shuffleWithSeed = <T,>(items: T[], seed: number) => {
    const list = [...items];
    let value = seed || 1;
    for (let i = list.length - 1; i > 0; i -= 1) {
      value = (value * 1664525 + 1013904223) % 4294967296;
      const index = value % (i + 1);
      [list[i], list[index]] = [list[index], list[i]];
    }
    return list;
  };

  useEffect(() => {
    if (!questions.length || !attempt?.id) {
      setDisplayQuestions(questions);
      return;
    }
    const seededQuestions = shuffleWithSeed(questions, attempt.id);
    const shuffled = seededQuestions.map(question => ({
      ...question,
      options: shuffleWithSeed(question.options, attempt.id + question.id),
    }));
    setDisplayQuestions(shuffled);
  }, [questions, attempt?.id]);

  const progressPercent = useMemo(() => {
    if (questions.length === 0) return 0;
    const answeredCount = Object.keys(answers).length;
    return Math.round((answeredCount / questions.length) * 100);
  }, [answers, questions.length]);

  const handleSelect = async (questionId: number, optionId: number) => {
    if (!attempt) return;
    try {
      setSaving(true);
      setError('');
      setAnswers(prev => ({ ...prev, [questionId]: optionId }));
      const res = await fetch(`/uploader/api/quiz-attempts/${attempt.id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, optionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save answer');
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  };

  const finishQuiz = async () => {
    if (!attempt) return;
    try {
      setSaving(true);
      setError('');
      const res = await fetch(`/uploader/api/quiz-attempts/${attempt.id}/finish`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to finish quiz');
      setResult(data);

      const resultRes = await fetch(`/uploader/api/quiz-attempts/${attempt.id}/results`);
      const resultData = await resultRes.json();
      if (resultRes.ok) {
        const map: Record<number, { correctOptionId: number | null; isCorrect: boolean | null }> = {};
        (resultData.results || []).forEach((row: any) => {
          const questionId = Number(row.question_id);
          if (!Number.isFinite(questionId)) return;
          map[questionId] = {
            correctOptionId: row.correct_option_id ? Number(row.correct_option_id) : null,
            isCorrect: row.is_correct === null ? null : Boolean(row.is_correct),
          };
        });
        setQuestionResults(map);
      }
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  };

  const retakeQuiz = async () => {
    try {
      setSaving(true);
      setError('');
      const attemptRes = await fetch('/uploader/api/quiz-attempts/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId }),
      });
      const attemptData = await attemptRes.json();
      if (!attemptRes.ok) throw new Error(attemptData.error || 'Failed to start attempt');
      setAttempt(attemptData.attempt);

      const answered: Record<number, number> = {};
      (attemptData.answers || []).forEach((item: any) => {
        if (item.question_id && item.selected_option_id) {
          answered[Number(item.question_id)] = Number(item.selected_option_id);
        }
      });
      setAnswers(answered);
      setQuestionResults({});
      setResult(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="ui-shell ui-shell--light">
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {loading && <p>Cargando quiz…</p>}
        {error && <p style={{ color: '#f87171' }}>{error}</p>}
        {quiz && attempt && (
          <>
            <div className="quiz-header">
              <div>
                <div className="ui-tag">My Quiz</div>
                <h1>{quiz.title}</h1>
                {quiz.description && <p className="ui-muted">{quiz.description}</p>}
              </div>
            </div>

            {!result && (
              <section className="quiz-summary">
                <h2>Resumen del quiz</h2>
                <div className="quiz-summary__row">
                  <span>Curso</span>
                  <strong>
                    {quiz.course_title || '—'}
                    {quiz.lesson_title ? ` · ${quiz.lesson_title}` : ''}
                  </strong>
                </div>
                <div className="quiz-summary__row">
                  <span>Estudiante</span>
                  <strong>{meLabel || `#${attempt.id}`}</strong>
                </div>
                <div className="quiz-summary__row">
                  <span>Inicio</span>
                  <strong>{new Date(attempt.started_at).toLocaleString()}</strong>
                </div>
                <div className="quiz-summary__row">
                  <span>Fin</span>
                  <strong>{attempt.finished_at ? new Date(attempt.finished_at).toLocaleString() : '—'}</strong>
                </div>
              </section>
            )}

            <div className="quiz-progress">
              <div className="quiz-progress__bar">
                <span style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="quiz-progress__label">{progressPercent}% completado</div>
            </div>

            {!result && (
              <>
                {displayQuestions.map(question => (
                  <div key={question.id} className="quiz-question">
                    <h3>{question.order}. {question.text}</h3>
                    <div className="quiz-options">
                      {question.options.map(option => {
                        const selected = answers[question.id] === option.id;
                        const resultInfo = questionResults[question.id];
                        const isCorrectOption = resultInfo?.correctOptionId === option.id;
                        const showResult = Boolean(result);
                        const isWrongSelected = showResult && selected && !isCorrectOption;

                        return (
                          <button
                            key={option.id}
                            type="button"
                            className={`quiz-option${selected ? ' is-selected' : ''}${showResult && isCorrectOption ? ' is-correct' : ''}${showResult && isWrongSelected ? ' is-wrong' : ''}`}
                            onClick={() => handleSelect(question.id, option.id)}
                            disabled={Boolean(result)}
                          >
                            {option.text}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="quiz-actions">
                  <button
                    type="button"
                    className="ui-button ui-button-primary"
                    onClick={finishQuiz}
                    disabled={saving || questions.length === 0}
                  >
                    Finalizar quiz
                  </button>
                </div>
              </>
            )}

            {result && (
              <div className="quiz-result-card">
                <h2>Resumen del quiz</h2>
                <div className="quiz-result-card__row">
                  <span>Curso</span>
                  <strong>
                    {quiz.course_title || '—'}
                    {quiz.lesson_title ? ` · ${quiz.lesson_title}` : ''}
                  </strong>
                </div>
                <div className="quiz-result-card__row">
                  <span>Estudiante</span>
                  <strong>{meLabel || `#${attempt.id}`}</strong>
                </div>
                <div className="quiz-result-card__row">
                  <span>Inicio</span>
                  <strong>{new Date(attempt.started_at).toLocaleString()}</strong>
                </div>
                <div className="quiz-result-card__row">
                  <span>Fin</span>
                  <strong>{new Date().toLocaleString()}</strong>
                </div>
                <div className="quiz-result-card__divider" />
                <div className="quiz-result-card__row">
                  <span>Puntaje</span>
                  <strong>{result.scorePercent}%</strong>
                </div>
                <div className="quiz-result-card__row">
                  <span>Correctas</span>
                  <strong>{result.totalCorrect}</strong>
                </div>
                <div className="quiz-result-card__row">
                  <span>Incorrectas</span>
                  <strong>{result.totalWrong}</strong>
                </div>
                <div className="quiz-result-card__actions">
                  <button
                    type="button"
                    className="ui-button ui-button-primary"
                    onClick={retakeQuiz}
                    disabled={saving}
                  >
                    Repetir quiz
                  </button>
                  <button
                    type="button"
                    className="ui-button ui-button-secondary"
                    onClick={() => router.push('/quiz')}
                  >
                    Ver todos los quizzes
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
