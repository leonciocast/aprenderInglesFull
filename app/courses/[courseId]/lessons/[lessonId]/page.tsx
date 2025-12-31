'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const SEEK_SECONDS = 10;
const NOTE_KEY_PREFIX = 'lesson-note:';

type Lesson = {
  id: number;
  title: string;
  lesson_order: number;
  video_url: string;
  notes?: string;
};

export default function CourseLessonPage() {
  const router = useRouter();
  const params = useParams();
  const lessonId = Number(params.lessonId);
  const courseId = Number(params.courseId);

  const [courseTitle, setCourseTitle] = useState('');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [note, setNote] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPreviewSeeked, setHasPreviewSeeked] = useState(false);
  const [lastSavedNote, setLastSavedNote] = useState('');
  const saveTimer = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!Number.isFinite(courseId)) return;
    fetch(`/uploader/api/courses/${courseId}`)
      .then(async res => {
        const data = await res.json();
        if (res.status === 401) {
          router.replace('/auth/login');
          return;
        }
        if (!res.ok) throw new Error(data.error || 'Failed to load course');
        const course = data.course;
        const lessonList = data.lessons || [];
        setCourseTitle(course?.title || '');
        setLessons(lessonList);
        const currentLesson = lessonList.find((item: Lesson) => item.id === lessonId);
        if (!currentLesson) {
          throw new Error('Lesson not found');
        }
        setLesson(currentLesson);
      })
      .catch(err => {
        console.error(err);
        router.replace('/courses');
      });
  }, [courseId, lessonId, router]);

  const videoSrc = useMemo(() => {
    return lesson?.video_url || '';
  }, [lesson]);

  useEffect(() => {
    if (!Number.isFinite(lessonId)) return;
    const key = `${NOTE_KEY_PREFIX}${lessonId}`;
    const cached = window.localStorage.getItem(key) || '';
    setNote(cached);
    setLastSavedNote('');

    let cancelled = false;
    fetch(`/uploader/api/lesson-notes?lessonId=${lessonId}`)
      .then(async res => {
        const data = await res.json();
        if (res.status === 401) {
          return { note: '' };
        }
        if (!res.ok) throw new Error(data?.error || 'Failed to load note');
        return data;
      })
      .then(data => {
        if (cancelled) return;
        const serverNote = String(data?.note || '');
        if (serverNote && serverNote !== cached) {
          window.localStorage.setItem(key, serverNote);
          setNote(serverNote);
        }
        if (serverNote) {
          setLastSavedNote(serverNote);
        }
      })
      .catch(err => {
        console.error('Load note error:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  useEffect(() => {
    if (!Number.isFinite(lessonId)) return;
    const key = `${NOTE_KEY_PREFIX}${lessonId}`;
    if (note.trim()) {
      window.localStorage.setItem(key, note);
    } else {
      window.localStorage.removeItem(key);
    }
  }, [note, lessonId]);

  const sendNote = (noteToSave: string, force = false) => {
    if (!Number.isFinite(lessonId)) return;
    if (!force && noteToSave === lastSavedNote) return;
    if (!noteToSave.trim() && !lastSavedNote.trim() && !force) return;

    fetch('/uploader/api/lesson-notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      keepalive: true,
      body: JSON.stringify({
        note: noteToSave,
        lessonId,
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
    if (!Number.isFinite(lessonId)) return;
    if (!note.trim() && !lastSavedNote.trim()) return;

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
  }, [note, lessonId, lastSavedNote]);

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
  }, [note, lessonId, lastSavedNote]);

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

  if (!lesson) {
    return (
      <main
        className="ui-shell ui-shell--light"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Cargando lección…
      </main>
    );
  }

  return (
    <main className="ui-shell ui-shell--light">
      <div className="lesson-layout" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <aside className="lesson-sidebar">
          <button
            type="button"
            onClick={() => router.push('/courses')}
            className="ui-button ui-button-outline"
            style={{ marginBottom: 12, width: '100%' }}
          >
            ← Volver a cursos
          </button>
          <div className="ui-muted" style={{ fontSize: 13, marginBottom: 6 }}>
            Curso
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#192335' }}>
            {courseTitle || 'Lecciones'}
          </div>
          <div className="ui-muted" style={{ fontSize: 12, marginBottom: 8 }}>
            Lecciones
          </div>
          <div className="lesson-list">
            {lessons.map(item => {
              const isActive = item.id === lessonId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    router.push(`/courses/${courseId}/lessons/${item.id}`)
                  }
                  className={`lesson-item${isActive ? ' lesson-item--active' : ''}`}
                >
                  <div className="ui-muted" style={{ fontSize: 12, marginBottom: 4 }}>
                    Lección {item.lesson_order}
                  </div>
                  <div>{item.title}</div>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="lesson-content">
          <header style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: 28, marginBottom: 6, color: '#192335' }}>{lesson.title}</h1>
            {lesson.notes && (
              <p className="ui-muted" style={{ maxWidth: 720 }}>{lesson.notes}</p>
            )}
          </header>

          <section className="lesson-player">
            <div style={{ borderRadius: 12, overflow: 'hidden', backgroundColor: '#e6e9f8' }}>
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
                className="ui-button ui-button-primary"
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
                className="ui-button ui-button-secondary"
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
                className="ui-button ui-button-secondary"
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

          <section className="lesson-notes">
            <h2 style={{ fontSize: 18, marginBottom: 10 }}>Tu nota</h2>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Escribe lo que piensas sobre el video..."
              rows={6}
              className="ui-textarea"
              style={{ fontSize: 14, resize: 'vertical' }}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
