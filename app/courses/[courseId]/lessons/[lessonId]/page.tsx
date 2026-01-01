'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const SEEK_SECONDS = 10;
const COUNTDOWN_START = 5;
const NOTE_KEY_PREFIX = 'lesson-note:';

type Lesson = {
  id: number;
  title: string;
  lesson_order: number;
  video_url: string;
  notes?: string;
  progress_percent?: number;
  completed_at?: string | null;
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
  const [progress, setProgress] = useState(0);
  const [lastSavedProgress, setLastSavedProgress] = useState(0);
  const [savedPosition, setSavedPosition] = useState<number | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [autoplayEnabled, setAutoplayEnabled] = useState(false);
  const [autoAdvanceNext, setAutoAdvanceNext] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [countdownProgress, setCountdownProgress] = useState(0);
  const [pendingNextLessonId, setPendingNextLessonId] = useState<number | null>(null);
  const countdownEndRef = useRef<number | null>(null);
  const saveTimer = useRef<number | null>(null);
  const progressTimer = useRef<number | null>(null);
  const countdownTimer = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hasRestoredProgress = useRef(false);
  const AUTOPLAY_KEY = 'lesson-autoplay-enabled';
  const AUTOPLAY_NEXT_KEY = 'lesson-autoplay-next';

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

  useEffect(() => {
    const stored = window.localStorage.getItem(AUTOPLAY_KEY);
    if (stored === 'true') {
      setAutoplayEnabled(true);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(AUTOPLAY_KEY, autoplayEnabled ? 'true' : 'false');
    if (!autoplayEnabled) {
      setCountdownSeconds(null);
      if (countdownTimer.current) {
        window.clearInterval(countdownTimer.current);
        countdownTimer.current = null;
      }
    }
  }, [autoplayEnabled]);

  useEffect(() => {
    const stored = window.sessionStorage.getItem(AUTOPLAY_NEXT_KEY);
    if (stored === 'true') {
      setAutoAdvanceNext(true);
      window.sessionStorage.removeItem(AUTOPLAY_NEXT_KEY);
    }
  }, []);

  useEffect(() => {
    const current = lessons.find(item => item.id === lessonId);
    if (!current) return;
    const currentProgress = Math.round(Number(current.progress_percent || 0));
    if (currentProgress > progress) {
      setProgress(currentProgress);
      setLastSavedProgress(currentProgress);
    }
  }, [lessons, lessonId, progress]);

  const videoSrc = useMemo(() => {
    return lesson?.video_url || '';
  }, [lesson]);

  const isCompleted = progress >= 90;

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
    let cancelled = false;
    fetch(`/uploader/api/lesson-progress?lessonId=${lessonId}`)
      .then(async res => {
        const data = await res.json();
        if (res.status === 401) {
          return { progressPercent: 0, positionSeconds: 0, durationSeconds: 0 };
        }
        if (!res.ok) throw new Error(data?.error || 'Failed to load progress');
        return data;
      })
      .then(data => {
        if (cancelled) return;
        const pct = Math.max(0, Math.min(100, Number(data?.progressPercent || 0)));
        const pos = Number(data?.positionSeconds || 0);
        const dur = Number(data?.durationSeconds || 0);
        setProgress(pct);
        setLastSavedProgress(pct);
        if (pos > 0) {
          setSavedPosition(pos);
        }
        if (dur > 0) {
          setDurationSeconds(dur);
        }
      })
      .catch(err => {
        console.error('Load progress error:', err);
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

  const sendProgress = (percent: number, force = false) => {
    if (!Number.isFinite(lessonId)) return;
    if (!durationSeconds) return;
    if (!force && Math.abs(percent - lastSavedProgress) < 1) return;

    const el = videoRef.current;
    const positionSeconds = el ? Math.floor(el.currentTime || 0) : 0;
    const duration = el ? Math.floor(el.duration || 0) : durationSeconds;

    fetch('/uploader/api/lesson-progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      keepalive: true,
      body: JSON.stringify({
        lessonId,
        progressPercent: percent,
        positionSeconds,
        durationSeconds: duration,
      }),
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to save progress');
        }
        setLastSavedProgress(percent);
      })
      .catch(err => {
        console.error('Save progress error:', err);
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
    if (!Number.isFinite(lessonId)) return;
    if (!durationSeconds) return;
    if (progressTimer.current) {
      window.clearTimeout(progressTimer.current);
    }

    progressTimer.current = window.setTimeout(() => {
      sendProgress(progress);
    }, 1200);

    return () => {
      if (progressTimer.current) {
        window.clearTimeout(progressTimer.current);
      }
    };
  }, [progress, lessonId, durationSeconds, lastSavedProgress]);

  useEffect(() => {
    if (!Number.isFinite(lessonId)) return;
    setLessons(prev =>
      prev.map(item => {
        if (item.id !== lessonId) return item;
        return {
          ...item,
          progress_percent: progress,
          completed_at: progress >= 90 ? item.completed_at || new Date().toISOString() : item.completed_at,
        };
      }),
    );
  }, [progress, lessonId]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendNote(note, true);
        sendProgress(progress, true);
      }
    };

    const handleBeforeUnload = () => {
      sendNote(note, true);
      sendProgress(progress, true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [note, lessonId, lastSavedNote, progress, durationSeconds, lastSavedProgress]);

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
    if (Number.isFinite(el.duration)) {
      setDurationSeconds(Math.floor(el.duration || 0));
    }
    if (!autoplayEnabled && !savedPosition && Number.isFinite(el.duration) && el.duration > 0.2) {
      el.currentTime = 0.1;
    }
  };

  const handleSeeked = () => {
    if (!hasPreviewSeeked && !autoplayEnabled) {
      videoRef.current?.pause();
      setHasPreviewSeeked(true);
    }
  };

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (!autoplayEnabled || !autoAdvanceNext) return;
    if (!Number.isFinite(el.duration) || el.duration <= 0) return;
    if (savedPosition && savedPosition > 0.2) {
      el.currentTime = Math.min(savedPosition, Math.max(0, el.duration - 0.2));
      hasRestoredProgress.current = true;
      setHasPreviewSeeked(true);
    }
    void el.play().catch(() => undefined);
    setAutoAdvanceNext(false);
  }, [autoplayEnabled, autoAdvanceNext, lessonId, durationSeconds, savedPosition]);

  const advanceToNextLesson = () => {
    setAutoAdvanceNext(true);
    window.sessionStorage.setItem(AUTOPLAY_NEXT_KEY, 'true');
    const currentIndex = lessons.findIndex(item => item.id === lessonId);
    const nextLesson = currentIndex >= 0 ? lessons[currentIndex + 1] : null;
    if (nextLesson?.id) {
      setPendingNextLessonId(nextLesson.id);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(100);
    sendProgress(100, true);
    if (autoplayEnabled) {
      setCountdownSeconds(COUNTDOWN_START);
      setCountdownProgress(0);
      if (countdownTimer.current) {
        window.clearInterval(countdownTimer.current);
      }
      countdownEndRef.current = Date.now() + COUNTDOWN_START * 1000;
      countdownTimer.current = window.setInterval(() => {
        const endTime = countdownEndRef.current;
        if (!endTime) return;
        const remainingMs = Math.max(0, endTime - Date.now());
        const remainingSeconds = Math.ceil(remainingMs / 1000);
        const progressValue = Math.min(
          100,
          Math.max(0, Math.round(((COUNTDOWN_START * 1000 - remainingMs) / (COUNTDOWN_START * 1000)) * 100)),
        );
        setCountdownSeconds(remainingSeconds);
        setCountdownProgress(progressValue);
        if (remainingMs <= 0) {
          if (countdownTimer.current) {
            window.clearInterval(countdownTimer.current);
            countdownTimer.current = null;
          }
          countdownEndRef.current = null;
          setCountdownSeconds(null);
          setCountdownProgress(100);
          advanceToNextLesson();
        }
      }, 100);
    }
  };

  const handleTimeUpdate = () => {
    const el = videoRef.current;
    if (!el || !Number.isFinite(el.duration) || el.duration <= 0) return;
    const pct = Math.min(100, Math.round((el.currentTime / el.duration) * 100));
    setProgress(pct);
  };

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !Number.isFinite(el.duration) || !savedPosition) return;
    if (hasRestoredProgress.current) return;
    if (savedPosition > 0.2 && el.duration > 0.2) {
      el.currentTime = Math.min(savedPosition, Math.max(0, el.duration - 0.2));
      hasRestoredProgress.current = true;
      setHasPreviewSeeked(true);
    }
  }, [savedPosition, durationSeconds]);

  useEffect(() => {
    return () => {
      if (countdownTimer.current) {
        window.clearInterval(countdownTimer.current);
        countdownTimer.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!pendingNextLessonId) return;
    router.push(`/courses/${courseId}/lessons/${pendingNextLessonId}`);
    setPendingNextLessonId(null);
  }, [pendingNextLessonId, courseId, router]);

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
          <div className="lesson-sidebar-toggle lesson-sidebar-toggle--top">
            <span className="lesson-sidebar-toggle__label">Autoplay</span>
            <label className="lesson-switch">
              <input
                type="checkbox"
                checked={autoplayEnabled}
                onChange={e => setAutoplayEnabled(e.target.checked)}
              />
              <span className="lesson-switch__track">
                <span className="lesson-switch__thumb">
                  {autoplayEnabled ? 'ON' : 'OFF'}
                </span>
              </span>
            </label>
          </div>

          <div className="lesson-list">
            {lessons.map(item => {
              const isActive = item.id === lessonId;
              const itemProgress = Math.round(Number(item.progress_percent || 0));
              const itemCompleted = itemProgress >= 90;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setAutoAdvanceNext(false);
                    setCountdownSeconds(null);
                    if (countdownTimer.current) {
                      window.clearInterval(countdownTimer.current);
                      countdownTimer.current = null;
                    }
                    window.sessionStorage.removeItem(AUTOPLAY_NEXT_KEY);
                    router.push(`/courses/${courseId}/lessons/${item.id}`);
                  }}
                  className={`lesson-item${isActive ? ' lesson-item--active' : ''}`}
                >
                  <div className="ui-muted" style={{ fontSize: 12, marginBottom: 4 }}>
                    Lección {item.lesson_order}
                  </div>
                  <div>{item.title}</div>
                  <div className="lesson-item__progress">
                    <span
                      className="lesson-item__progress-ring"
                      style={{
                        ['--progress' as any]: `${itemProgress}%`,
                      }}
                    >
                      <span className="lesson-item__progress-text">%</span>
                    </span>
                    {itemCompleted && (
                      <span className="lesson-item__check" aria-label="Completada">
                        ✓
                      </span>
                    )}
                  </div>
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

          <section className="lesson-progress">
            <div className="lesson-progress__header">
              <span>Progreso de la lección</span>
              <span>{progress}%{isCompleted ? ' • Completada' : ''}</span>
            </div>
            <div className="lesson-progress__track">
              <div
                className="lesson-progress__fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </section>

          <section className="lesson-player">
            <div style={{ borderRadius: 12, overflow: 'hidden', backgroundColor: '#e6e9f8', position: 'relative' }}>
              {countdownSeconds !== null && (
                <div className="lesson-countdown">
                  <div className="lesson-countdown__text">{countdownSeconds}</div>
                  <button
                    type="button"
                    className="lesson-countdown__skip"
                    style={{
                      ['--progress' as any]: `${countdownProgress}%`,
                    }}
                    onClick={() => {
                      if (countdownTimer.current) {
                        window.clearInterval(countdownTimer.current);
                        countdownTimer.current = null;
                      }
                      countdownEndRef.current = null;
                      setCountdownSeconds(null);
                      setCountdownProgress(0);
                      advanceToNextLesson();
                    }}
                  >
                    <span className="lesson-countdown__skip-text">Próximo video</span>
                  </button>
                </div>
              )}
              <video
                ref={videoRef}
                src={videoSrc}
                style={{ width: '100%', display: 'block' }}
                preload="auto"
                controls
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={handleEnded}
                onLoadedMetadata={handleLoadedMetadata}
                onSeeked={handleSeeked}
                onTimeUpdate={handleTimeUpdate}
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
