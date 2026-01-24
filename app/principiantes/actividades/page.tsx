'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchMeWithRefresh } from '@/app/lib/auth-client';

type Question = {
  id: string;
  image: string;
  correct: string;
  options: string[];
};

const ACTIVITY_FILES = [
  'Cooking-chair-sofa.png',
  'Dance-chair-sofa.png',
  'Drawing-chair-sofa.png',
  'Gardening-chair-sofa.png',
  'Painting-chair-sofa.png',
  'Play_guitar-chair-sofa.png',
  'Reading-chair-sofa.png',
  'Taking_photo-chair-sofa.png',
  'Working_out-chair-sofa.png',
];

const ACTIVITY_STOPWORDS = ['chair', 'sofa'];
const IMAGE_BASE = '/uploader/image/Activities';
const AUDIO_BASE = '/uploader/Audio/Activities';

const activityMap: Record<string, string> = {
  dance: 'Dancing',
  play_guitar: 'Playing guitar',
  taking_photo: 'Taking photos',
  working_out: 'Working out',
};

const toDisplayLabel = (value: string) => {
  if (!value) return '';
  const normalized = value.toLowerCase();
  const mapped = activityMap[normalized] || value.replace(/_/g, ' ');
  return mapped
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const toAudioName = (value: string) => {
  if (!value) return '';
  const normalized = value.toLowerCase();
  const mapped = activityMap[normalized] || value.replace(/_/g, ' ');
  const label = mapped
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  return `Activities_${label}`;
};

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
  const correctList = ACTIVITY_FILES.map(file => {
    const base = file.replace(/\.[^.]+$/, '');
    const parts = base
      .split('-')
      .filter(Boolean)
      .filter(part => !ACTIVITY_STOPWORDS.includes(part.toLowerCase()));
    return parts[0];
  }).filter(Boolean);

  return ACTIVITY_FILES.map(file => {
    const base = file.replace(/\.[^.]+$/, '');
    const parts = base
      .split('-')
      .filter(Boolean)
      .filter(part => !ACTIVITY_STOPWORDS.includes(part.toLowerCase()));
    const [correct, alt1, alt2] = parts;
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

export default function ActividadesPage() {
  const router = useRouter();
  const questions = useMemo(() => buildQuestions(), []);
  const total = questions.length;
  const [authReady, setAuthReady] = useState(false);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const meRes = await fetchMeWithRefresh();
        if (!meRes.ok) {
          router.replace(`/auth/login?next=${encodeURIComponent('/principiantes/actividades')}`);
          return;
        }
        setAuthReady(true);
      } catch {
        router.replace(`/auth/login?next=${encodeURIComponent('/principiantes/actividades')}`);
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

  const playAudio = (value: string) => {
    if (!value) return;
    const audioName = toAudioName(value);
    if (!audioName) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = encodeURI(`${AUDIO_BASE}/${audioName}.wav`);
    audio.currentTime = 0;
    void audio.play();
  };

  const handleSelect = (value: string) => {
    if (selected) return;
    setSelected(value);
    if (value === current.correct) {
      setCorrectCount(prev => prev + 1);
    }
    playAudio(current.correct);
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
      <audio ref={audioRef} preload="auto" />
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
              <h1>Actividades</h1>
              <p className="ui-muted">Selecciona la actividad correcta en cada tarjeta.</p>
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
              <h3>¿Qué actividad es?</h3>
              <div
                style={{
                  background: '#fff',
                  borderRadius: 18,
                  padding: 18,
                  display: 'grid',
                  placeItems: 'center',
                  boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
                  position: 'relative',
                }}
              >
                {selected && (
                  <button
                    type="button"
                    aria-label="Reproducir audio"
                    onClick={() => playAudio(current.correct)}
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      width: 46,
                      height: 46,
                      borderRadius: 14,
                      border: '1px solid #e2e8f0',
                      background: '#fff',
                      display: 'grid',
                      placeItems: 'center',
                      boxShadow: '0 10px 24px rgba(15, 23, 42, 0.12)',
                      cursor: 'pointer',
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="28"
                      height="28"
                      viewBox="0 0 256 256"
                      role="img"
                      aria-hidden="true"
                    >
                      <path
                        d="M72 98 L168 64 L168 192 L72 158 Z"
                        fill="#ffffff"
                        stroke="#111"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <rect
                        x="34"
                        y="106"
                        width="46"
                        height="44"
                        rx="12"
                        fill="#ffffff"
                        stroke="#111"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M86 148 L168 178 L168 192 L72 158 Z"
                        fill="#d9d9d9"
                        opacity="0.6"
                      />
                      <path
                        d="M192 104 Q212 128 192 152"
                        fill="none"
                        stroke="#111"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M210 88 Q236 128 210 168"
                        fill="none"
                        stroke="#111"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M228 72 Q260 128 228 184"
                        fill="none"
                        stroke="#111"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}
                <img
                  src={current.image}
                  alt={`Actividad ${current.correct}`}
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
                      {toDisplayLabel(option)}
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
