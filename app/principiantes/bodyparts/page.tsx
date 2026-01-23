'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Question = {
  id: string;
  image: string;
  correct: string;
  options: string[];
};

const BODY_PART_FILES = [
  'arm-hand-nose.png',
  'ear-nose-mouth.png',
  'eye-nose-mouth.png',
  'hand-mouth-nose.png',
  'knee-nose-mouth.png',
  'leg-nose-mouth.png',
  'mouth-nose-eye.png',
  'nose-mouth-hand.png',
];

const IMAGE_BASE = '/uploader/image/BodyParts';

function hashString(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithSeed<T>(items: T[], seed: number) {
  const arr = [...items];
  const rand = mulberry32(seed);
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildQuestions(): Question[] {
  const correctList = BODY_PART_FILES.map(file => {
    const base = file.replace(/\.[^.]+$/, '');
    return base.split('-').filter(Boolean)[0];
  }).filter(Boolean);

  return BODY_PART_FILES.map(file => {
    const base = file.replace(/\.[^.]+$/, '');
    const [correct, alt1, alt2] = base.split('-');
    const fallbackPool = correctList.filter(item => item && item !== correct);
    const fallbackSeed = hashString(`${file}-fallback`);
    const fallbackShuffled = shuffleWithSeed(fallbackPool, fallbackSeed);
    const merged = [correct, alt1, alt2]
      .filter(Boolean)
      .concat(fallbackShuffled)
      .filter((value, index, arr) => arr.indexOf(value) === index)
      .slice(0, 3);
    const seed = hashString(file);
    const options = shuffleWithSeed(merged, seed);
    return {
      id: base,
      image: `${IMAGE_BASE}/${file}`,
      correct,
      options,
    };
  });
}

export default function BodyPartsPage() {
  const router = useRouter();
  const questions = useMemo(() => buildQuestions(), []);
  const total = questions.length;
  const [authReady, setAuthReady] = useState(false);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const meRes = await fetch('/uploader/api/auth/me');
        if (!meRes.ok) {
          router.replace(`/auth/login?next=${encodeURIComponent('/principiantes/bodyparts')}`);
          return;
        }
        setAuthReady(true);
      } catch {
        router.replace(`/auth/login?next=${encodeURIComponent('/principiantes/bodyparts')}`);
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

  const current = questions[index];
  const progressPercent = Math.round(((index + (finished ? 1 : 0)) / total) * 100);

  const handleSelect = (value: string) => {
    if (selected) return;
    setSelected(value);
    if (value === current.correct) {
      setCorrectCount(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (index + 1 >= total) {
      setFinished(true);
      return;
    }
    setIndex(prev => prev + 1);
    setSelected(null);
  };

  const resetGame = () => {
    setIndex(0);
    setSelected(null);
    setCorrectCount(0);
    setFinished(false);
  };

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
          <section className="quiz-header">
            <div>
              <h1>Partes del cuerpo</h1>
              <p className="ui-muted">Selecciona la parte correcta en cada tarjeta.</p>
            </div>
            <button
              type="button"
              className="ui-button"
              onClick={() => router.push('/principiantes')}
            >
              Volver al libro
            </button>
          </section>

          <div className="quiz-progress">
            <div className="quiz-progress__bar">
              <span style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="quiz-progress__label">
              {Math.min(index + 1, total)} / {total}
            </div>
          </div>

          {!finished && current && (
            <section className="quiz-question">
              <h3>¿Qué parte del cuerpo es?</h3>
              <div
                style={{
                  background: '#fff',
                  borderRadius: 18,
                  padding: 18,
                  display: 'grid',
                  placeItems: 'center',
                  boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
                }}
              >
                <img
                  src={current.image}
                  alt={`Parte del cuerpo ${current.correct}`}
                  style={{ maxWidth: '100%', height: 240, objectFit: 'contain' }}
                />
              </div>
              <div className="quiz-options">
                {current.options.map(option => {
                  const isSelected = selected === option;
                  const isCorrect = selected && option === current.correct;
                  const isWrongSelected = selected === option && option !== current.correct;
                  return (
                    <button
                      key={option}
                      type="button"
                      className={`quiz-option${isSelected ? ' is-selected' : ''}${isCorrect ? ' is-correct' : ''}${isWrongSelected ? ' is-wrong' : ''}`}
                      onClick={() => handleSelect(option)}
                      disabled={Boolean(selected)}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              <div className="quiz-actions">
                {selected && (
                  <div className="ui-muted">
                    {selected === current.correct ? '✅ ¡Correcto!' : '❌ Incorrecto.'}
                  </div>
                )}
                <button
                  type="button"
                  className="ui-button ui-button-primary"
                  onClick={handleNext}
                  disabled={!selected}
                >
                  {index + 1 >= total ? 'Ver resultados' : 'Siguiente'}
                </button>
              </div>
            </section>
          )}

          {finished && (
            <div className="quiz-result-card">
              <h2>Resultados</h2>
              <div className="quiz-result-card__row">
                <span>Correctas</span>
                <strong>
                  {correctCount} / {total}
                </strong>
              </div>
              <div className="quiz-result-card__row">
                <span>Porcentaje</span>
                <strong>{Math.round((correctCount / total) * 100)}%</strong>
              </div>
              <div className="quiz-result-card__divider" />
              <div className="quiz-result-card__actions">
                <button
                  type="button"
                  className="ui-button ui-button-primary"
                  onClick={resetGame}
                >
                  Repetir
                </button>
                <button
                  type="button"
                  className="ui-button"
                  onClick={() => router.push('/principiantes')}
                >
                  Volver al libro
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
