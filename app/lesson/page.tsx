 'use client';

import { Suspense, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type PublicLesson = {
  id: string;
  title: string;
  src: string;
  duration?: string;
};

const CDN_BASE = 'https://cdn.aprenderinglesfull.com';
const PUBLIC_LESSONS: PublicLesson[] = [
  {
    id: '10-formas-like-it',
    title: '10 formas de decir I like it',
    src: `${CDN_BASE}/10%20likes.mp4`,
    duration: '10:40',
  },
];

const BRAND_LOGO_URL = 'https://cdn.aprenderinglesfull.com/logo_ingles.png';

function LessonVideoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const activeId = searchParams.get('lesson') || PUBLIC_LESSONS[0]?.id;
  const activeLesson =
    PUBLIC_LESSONS.find(item => item.id === activeId) || PUBLIC_LESSONS[0];

  const title = activeLesson?.title || 'Lección';
  const videoSrc = activeLesson?.src || '';

  const handleSelectLesson = (lessonId: string) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set('lesson', lessonId);
    router.push(`/lesson?${next.toString()}`);
  };

  const handleTogglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
    } else {
      void el.play();
    }
  };

  const handleSeek = (deltaSeconds: number) => {
    const el = videoRef.current;
    if (!el) return;
    const next = Math.max(0, Math.min(el.duration || 0, el.currentTime + deltaSeconds));
    el.currentTime = next;
  };

  return (
    <main className="ui-shell ui-shell--light">
      <div className="lesson-layout" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <aside className="lesson-sidebar">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            <img
              src={BRAND_LOGO_URL}
              alt="AprenderInglesFull"
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: '#fff',
                padding: 4,
                border: '1px solid #ece9f8',
              }}
            />
            <div>
              <div className="ui-muted" style={{ fontSize: 12 }}>
                Lecciones
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#192335' }}>
                Inglés Full
              </div>
            </div>
          </div>
          <div className="ui-muted" style={{ fontSize: 12, marginBottom: 8 }}>
            Playlist
          </div>
          <div className="lesson-list">
            {PUBLIC_LESSONS.map(item => {
              const isActive = item.id === activeLesson?.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`lesson-item${isActive ? ' lesson-item--active' : ''}`}
                  onClick={() => handleSelectLesson(item.id)}
                >
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{item.title}</div>
                  {item.duration && (
                    <div className="ui-muted" style={{ marginTop: 6, fontSize: 12 }}>
                      {item.duration}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        <div className="lesson-content">
          <header className="lesson-header" style={{ marginBottom: 20 }}>
            <span className="auth-pill">Bono</span>
            <h1 style={{ fontSize: 28, marginBottom: 6, color: '#192335' }}>{title}</h1>
            <p className="ui-muted" style={{ maxWidth: 720 }}>
              Domina expresiones reales con ejemplos claros y fáciles de recordar.
            </p>
          </header>

          <section className="lesson-player">
            <div
              style={{
                borderRadius: 12,
                overflow: 'hidden',
                backgroundColor: '#e6e9f8',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <video
                ref={videoRef}
                src={videoSrc}
                style={{
                  width: '100%',
                  display: 'block',
                  maxHeight: 520,
                  objectFit: 'contain',
                }}
                preload="auto"
                controls
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
              />
            </div>

            <div
              style={{
                marginTop: 14,
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <button type="button" onClick={handleTogglePlay} className="ui-button ui-button-primary">
                {isPlaying ? 'Pausar' : 'Reproducir'}
              </button>
              <button type="button" onClick={() => handleSeek(-10)} className="ui-button ui-button-secondary">
                -10s
              </button>
              <button type="button" onClick={() => handleSeek(10)} className="ui-button ui-button-secondary">
                +10s
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function LessonVideoPage() {
  return (
    <Suspense fallback={<div />}>
      <LessonVideoContent />
    </Suspense>
  );
}
