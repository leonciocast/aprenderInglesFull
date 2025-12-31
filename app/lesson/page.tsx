'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const DEFAULT_VIDEO_URL =
  'https://aprenderinglesfull-pdfs.s3.us-east-1.amazonaws.com/Website_hook.mp4';
const SEEK_SECONDS = 10;
const NOTE_KEY_PREFIX = 'lesson-note:';
const VISITOR_ID_KEY = 'lesson-visitor-id';

function LessonVideoContent() {
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [note, setNote] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPreviewSeeked, setHasPreviewSeeked] = useState(false);
  const [lastSavedNote, setLastSavedNote] = useState('');
  const saveTimer = useRef<number | null>(null);
  const [visitorId, setVisitorId] = useState('');

  const videoSrc = useMemo(() => {
    const src = searchParams.get('src');
    if (!src) return DEFAULT_VIDEO_URL;
    if (src.startsWith('https://')) return src;
    return DEFAULT_VIDEO_URL;
  }, [searchParams]);

  const title = 'Bienvenido.';

  const videoTitleParam = useMemo(() => {
    return searchParams.get('title') || '';
  }, [searchParams]);

  useEffect(() => {
    const key = `${NOTE_KEY_PREFIX}${videoSrc}`;
    const saved = window.localStorage.getItem(key);
    setNote(saved || '');
  }, [videoSrc]);

  useEffect(() => {
    const existing = window.localStorage.getItem(VISITOR_ID_KEY);
    if (existing) {
      setVisitorId(existing);
      return;
    }
    const generated = typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.localStorage.setItem(VISITOR_ID_KEY, generated);
    setVisitorId(generated);
  }, []);

  useEffect(() => {
    const key = `${NOTE_KEY_PREFIX}${videoSrc}`;
    if (note.trim()) {
      window.localStorage.setItem(key, note);
    } else {
      window.localStorage.removeItem(key);
    }
  }, [note, videoSrc]);

  const sendNote = (noteToSave: string, force = false) => {
    if (!noteToSave.trim() || !visitorId) return;
    if (!force && noteToSave === lastSavedNote) return;

    fetch('api/lesson-notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      keepalive: true,
      body: JSON.stringify({
        note: noteToSave,
        videoSrc,
        videoTitle: videoTitleParam || undefined,
        visitorId,
      }),
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to save note');
        }
        setLastSavedNote(noteToSave);
      })
      .catch(err => {
        console.error('Save note error:', err);
      });
  };

  useEffect(() => {
    if (!note.trim() || !visitorId) return;

    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
    }

    saveTimer.current = window.setTimeout(() => {
      sendNote(note);
    }, 1200);

    return () => {
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
      }
    };
  }, [note, videoSrc, videoTitleParam, lastSavedNote, visitorId]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendNote(note, true);
      }
    };

    const handleBeforeUnload = () => {
      sendNote(note, true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [note, visitorId, videoSrc, videoTitleParam, lastSavedNote]);

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

  const handleLoadedMetadata = () => {
    const el = videoRef.current;
    if (!el || hasPreviewSeeked) return;
    if (Number.isFinite(el.duration) && el.duration > 0.2) {
      el.currentTime = 0.1;
    }
  };

  const handleSeeked = () => {
    if (!hasPreviewSeeked) {
      videoRef.current?.pause();
      setHasPreviewSeeked(true);
    }
  };

  return (
    <main
      style={{
        padding: 24,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        maxWidth: 1000,
        margin: '0 auto',
        minHeight: '100vh',
        backgroundColor: '#020617',
        color: '#e5e7eb',
      }}
    >
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, marginBottom: 6 }}>{title}</h1>
      </header>

      <section
        style={{
          backgroundColor: '#0b1220',
          borderRadius: 12,
          border: '1px solid #1f2937',
          padding: 16,
          boxShadow: '0 20px 40px rgba(2, 6, 23, 0.35)',
        }}
      >
        <div style={{ borderRadius: 12, overflow: 'hidden', backgroundColor: '#0f172a' }}>
          <video
            ref={videoRef}
            src={videoSrc}
            style={{ width: '100%', display: 'block' }}
            preload="auto"
            controls
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            onLoadedMetadata={handleLoadedMetadata}
            onSeeked={handleSeeked}
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
          <button
            type="button"
            onClick={handleTogglePlay}
            style={{
              padding: '8px 16px',
              borderRadius: 9999,
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {isPlaying ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                aria-hidden="true"
                focusable="false"
                style={{ display: 'block' }}
              >
                <rect x="3" y="2.5" width="4" height="11" rx="1" fill="currentColor" />
                <rect x="9" y="2.5" width="4" height="11" rx="1" fill="currentColor" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                aria-hidden="true"
                focusable="false"
                style={{ display: 'block' }}
              >
                <polygon points="4,2.5 13,8 4,13.5" fill="currentColor" />
              </svg>
            )}
            {isPlaying ? 'Pausar' : 'Reproducir'}
          </button>
          <button
            type="button"
            onClick={() => handleSeek(-SEEK_SECONDS)}
            style={{
              padding: '8px 16px',
              borderRadius: 9999,
              border: '1px solid #334155',
              backgroundColor: '#0f172a',
              color: '#e2e8f0',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              aria-hidden="true"
              focusable="false"
              style={{ display: 'block' }}
            >
              <polygon points="8,3 1,9 8,15" fill="currentColor" />
              <polygon points="16,3 9,9 16,15" fill="currentColor" />
            </svg>
            -{SEEK_SECONDS}s
          </button>
          <button
            type="button"
            onClick={() => handleSeek(SEEK_SECONDS)}
            style={{
              padding: '8px 16px',
              borderRadius: 9999,
              border: '1px solid #334155',
              backgroundColor: '#0f172a',
              color: '#e2e8f0',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              aria-hidden="true"
              focusable="false"
              style={{ display: 'block' }}
            >
              <polygon points="10,3 17,9 10,15" fill="currentColor" />
              <polygon points="2,3 9,9 2,15" fill="currentColor" />
            </svg>
            +{SEEK_SECONDS}s
          </button>
        </div>
      </section>

      <section
        style={{
          marginTop: 16,
          backgroundColor: '#0b1220',
          borderRadius: 12,
          border: '1px solid #1f2937',
          padding: 16,
        }}
      >
        <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 8 }}>
          Haz clic en el enlace para unirte a mi canal de instagram
        </div>
        <a
          href="https://www.instagram.com/channel/AbbHN4iC8_wasTe2/"
          style={{
            color: '#93c5fd',
            wordBreak: 'break-all',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          https://www.instagram.com/channel/AbbHN4iC8_wasTe2/
        </a>
      </section>

      <section
        style={{
          marginTop: 24,
          backgroundColor: '#0b1220',
          borderRadius: 12,
          border: '1px solid #1f2937',
          padding: 16,
        }}
      >
        <h2 style={{ fontSize: 18, marginBottom: 10 }}>Tu nota</h2>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Escribe lo que piensas sobre el video..."
          rows={6}
          style={{
            width: '100%',
            padding: 12,
            borderRadius: 10,
            border: '1px solid #334155',
            backgroundColor: '#0f172a',
            color: '#e2e8f0',
            fontSize: 14,
            resize: 'vertical',
          }}
        />
      </section>
    </main>
  );
}

export default function LessonVideoPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            padding: 24,
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
            maxWidth: 1000,
            margin: '0 auto',
            minHeight: '100vh',
            backgroundColor: '#020617',
            color: '#e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>Loading lesson…</div>
        </main>
      }
    >
      <LessonVideoContent />
    </Suspense>
  );
}
