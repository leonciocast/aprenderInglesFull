'use client';

import { useState } from 'react';
import AdminShell from '../AdminShell';

type Course = {
  id: number;
  title: string;
  description?: string;
  cover_image_url?: string;
};

type Lesson = {
  id: number;
  title: string;
  lesson_order: number;
  video_url: string;
  notes?: string;
};

type MediaPickerType = 'image' | 'video';

export default function CoursesAdminPage() {
  const [password, setPassword] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Record<number, Lesson[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    coverImageUrl: '',
  });

  const [lessonDrafts, setLessonDrafts] = useState<Record<number, Partial<Lesson>>>({});
  const [videoOptions, setVideoOptions] = useState<string[]>([]);
  const [imageOptions, setImageOptions] = useState<string[]>([]);
  const [mediaPrefix, setMediaPrefix] = useState('');
  const [prefixOptions, setPrefixOptions] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerType, setPickerType] = useState<MediaPickerType>('image');
  const [pickerTarget, setPickerTarget] = useState<
    { kind: 'courseCover' } | { kind: 'lessonVideo'; courseId: number }
  >({ kind: 'courseCover' });

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/uploader/api/admin/courses', {
        headers: { 'x-admin-password': password },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load courses');
      setCourses(data.courses || []);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const loadLessons = async (courseId: number) => {
    try {
      const res = await fetch(`/uploader/api/admin/courses/${courseId}/lessons`, {
        headers: { 'x-admin-password': password },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load lessons');
      setLessons(prev => ({ ...prev, [courseId]: data.lessons || [] }));
    } catch (err: any) {
      setError(err.message || String(err));
    }
  };

  const createCourse = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/uploader/api/admin/courses', {
        method: 'POST',
        headers: {
          'x-admin-password': password,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCourse),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create course');
      setCourses(prev => [data.course, ...prev]);
      setNewCourse({ title: '', description: '', coverImageUrl: '' });
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const addLesson = async (courseId: number) => {
    try {
      setError(null);
      const draft = lessonDrafts[courseId] || {};
      const res = await fetch(`/uploader/api/admin/courses/${courseId}/lessons`, {
        method: 'POST',
        headers: {
          'x-admin-password': password,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: draft.title || '',
          videoUrl: draft.video_url || '',
          notes: draft.notes || '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add lesson');
      setLessons(prev => ({
        ...prev,
        [courseId]: [...(prev[courseId] || []), data.lesson],
      }));
      setLessonDrafts(prev => ({ ...prev, [courseId]: {} }));
    } catch (err: any) {
      setError(err.message || String(err));
    }
  };

  const loadMedia = async (type: MediaPickerType) => {
    const fetchMedia = async (prefixValue: string) => {
      const mediaType = type || 'video';
      const base = '/uploader/api/admin/media';
      const query =
        `type=${encodeURIComponent(mediaType)}` +
        (prefixValue ? `&prefix=${encodeURIComponent(prefixValue)}` : '');
      const res = await fetch(`${base}?${query}`, {
        headers: { 'x-admin-password': password },
      });
      const data = await res.json();
      return { ok: res.ok, data };
    };

    try {
      setMediaLoading(true);
      setMediaError(null);
      const first = await fetchMedia(mediaPrefix.trim());
      if (!first.ok) {
        const fallback = await fetchMedia('');
        if (fallback.ok) {
          setPrefixOptions(fallback.data.prefixes || []);
          if (type === 'image') {
            setImageOptions(fallback.data.items || []);
          } else {
            setVideoOptions(fallback.data.items || []);
          }
          setMediaError('Prefijo inválido. Mostrando todo el contenido.');
          return;
        }
        throw new Error(first.data.error || 'Failed to load media');
      }

      setPrefixOptions(first.data.prefixes || []);
      const items = first.data.items || [];
      if (type === 'image') {
        setImageOptions(items);
      } else {
        setVideoOptions(items);
      }
      if (items.length === 0 && mediaPrefix.trim()) {
        const fallback = await fetchMedia('');
        if (fallback.ok) {
          setPrefixOptions(fallback.data.prefixes || []);
          if (type === 'image') {
            setImageOptions(fallback.data.items || []);
          } else {
            setVideoOptions(fallback.data.items || []);
          }
          setMediaError('No se encontró ese prefijo. Mostrando todo el contenido.');
        } else {
          setMediaError(`No hay resultados para el prefijo "${mediaPrefix}".`);
        }
      }
    } catch (err: any) {
      setMediaError(err.message || String(err));
    } finally {
      setMediaLoading(false);
    }
  };

  const openPicker = async (
    type: MediaPickerType,
    target: { kind: 'courseCover' } | { kind: 'lessonVideo'; courseId: number },
  ) => {
    setMediaError(null);
    setPickerType(type);
    setPickerTarget(target);
    setPickerOpen(true);
    await loadMedia(type);
  };

  const pickItem = (url: string) => {
    if (pickerTarget.kind === 'courseCover') {
      setNewCourse(prev => ({ ...prev, coverImageUrl: url }));
    } else {
      const courseId = pickerTarget.courseId;
      setLessonDrafts(prev => ({
        ...prev,
        [courseId]: { ...prev[courseId], video_url: url },
      }));
    }
    setPickerOpen(false);
  };

  return (
    <AdminShell
      title="Course Control"
      description="Create courses, add lessons, and manage media assets."
    >
      <section className="admin-panel">
        <p className="ui-muted" style={{ marginBottom: 16 }}>
          Manage enrollments in{' '}
          <a href="/admin/enrollments">
            the enrollments module
          </a>
          .
        </p>

        <div style={{ marginBottom: 16 }}>
        <label>
          Admin password:{' '}
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="ui-input"
            style={{ minWidth: 220 }}
          />
        </label>
        <button
          type="button"
          onClick={loadCourses}
          disabled={!password || loading}
          className="ui-button ui-button-primary"
          style={{ marginLeft: 12 }}
        >
          Load courses
        </button>
      </div>

      {error && <p style={{ color: '#f87171', marginBottom: 16 }}>{error}</p>}

      <section className="ui-card" style={{ padding: 16, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12, color: '#192335' }}>Create course</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <input
            type="text"
            placeholder="S3 prefix (optional)"
            value={mediaPrefix}
            onChange={e => setMediaPrefix(e.target.value)}
            className="ui-input"
            style={{ minWidth: 220 }}
            list="prefix-options"
          />
          <datalist id="prefix-options">
            {prefixOptions.map(prefix => (
              <option key={prefix} value={prefix} />
            ))}
          </datalist>
          <button
            type="button"
            onClick={() => openPicker('image', { kind: 'courseCover' })}
            disabled={!password}
            className="ui-button ui-button-outline"
          >
            Browse images
          </button>
        </div>
        <div style={{ display: 'grid', gap: 10, maxWidth: 520 }}>
          <input
            type="text"
            placeholder="Title"
            value={newCourse.title}
            onChange={e => setNewCourse(prev => ({ ...prev, title: e.target.value }))}
            className="ui-input"
          />
          <input
            type="text"
            placeholder="Description"
            value={newCourse.description}
            onChange={e => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
            className="ui-input"
          />
          <input
            type="text"
            placeholder="Cover image URL"
            value={newCourse.coverImageUrl}
            onChange={e => setNewCourse(prev => ({ ...prev, coverImageUrl: e.target.value }))}
            className="ui-input"
          />
          <button
            type="button"
            onClick={createCourse}
            disabled={!password || loading || !newCourse.title}
            className="ui-button ui-button-primary"
          >
            Create course
          </button>
        </div>
      </section>

      {courses.map(course => (
        <section key={course.id} className="ui-card" style={{ padding: 16, marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, marginBottom: 6, color: '#192335' }}>{course.title}</h3>
          {course.description && (
            <p className="ui-muted" style={{ marginBottom: 8 }}>{course.description}</p>
          )}

          <button
            type="button"
            onClick={() => loadLessons(course.id)}
            className="ui-button ui-button-outline"
            style={{ marginBottom: 10 }}
          >
            Load lessons
          </button>
          <div style={{ marginBottom: 12 }}>
            <div className="ui-muted" style={{ fontSize: 13, marginBottom: 6 }}>
              Add lesson
            </div>
            <div style={{ display: 'grid', gap: 8, maxWidth: 520 }}>
              <input
                type="text"
                placeholder="Lesson title"
                value={lessonDrafts[course.id]?.title || ''}
                onChange={e =>
                  setLessonDrafts(prev => ({
                    ...prev,
                    [course.id]: { ...prev[course.id], title: e.target.value },
                  }))
                }
                className="ui-input"
              />
              <input
                type="text"
                placeholder="Video URL"
                value={lessonDrafts[course.id]?.video_url || ''}
                onChange={e =>
                  setLessonDrafts(prev => ({
                    ...prev,
                    [course.id]: { ...prev[course.id], video_url: e.target.value },
                  }))
                }
                className="ui-input"
              />
              <button
                type="button"
                onClick={() => openPicker('video', { kind: 'lessonVideo', courseId: course.id })}
                disabled={!password}
                className="ui-button ui-button-outline"
              >
                Browse videos
              </button>
              <textarea
                placeholder="Lesson notes (optional)"
                value={lessonDrafts[course.id]?.notes || ''}
                onChange={e =>
                  setLessonDrafts(prev => ({
                    ...prev,
                    [course.id]: { ...prev[course.id], notes: e.target.value },
                  }))
                }
                rows={3}
                className="ui-textarea"
                style={{ resize: 'vertical' }}
              />
              <button
                type="button"
                onClick={() => addLesson(course.id)}
                className="ui-button ui-button-primary"
              >
                Add lesson
              </button>
            </div>
          </div>

          {(lessons[course.id] || []).length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div className="ui-muted" style={{ fontSize: 13, marginBottom: 6 }}>
                Lessons
              </div>
              <ul style={{ paddingLeft: 18 }}>
                {(lessons[course.id] || []).map(item => (
                  <li key={item.id} style={{ marginBottom: 6 }}>
                    <strong>{item.lesson_order}.</strong> {item.title}
                  </li>
                ))}
              </ul>
            </div>
          )}

        </section>
      ))}

      {pickerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 60,
          }}
        >
          <div
            className="ui-card ui-card--glass"
            style={{
              width: '100%',
              maxWidth: 900,
              maxHeight: '80vh',
              overflow: 'auto',
              padding: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#192335' }}>
                {pickerType === 'image' ? 'Select an image' : 'Select a video'}
              </div>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="ui-button ui-button-outline"
                style={{ padding: '6px 12px' }}
                aria-label="Close"
              >
                Close
              </button>
            </div>

            {mediaLoading && <div className="ui-muted">Loading…</div>}
            {mediaError && (
              <div style={{ color: '#f87171', marginBottom: 10 }}>{mediaError}</div>
            )}

            <div
              style={{
                display: 'grid',
                gap: 12,
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              }}
            >
              {(pickerType === 'image' ? imageOptions : videoOptions).map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => pickItem(item)}
                  className="course-card"
                  style={{ textAlign: 'left', padding: 10 }}
                >
                  {pickerType === 'image' ? (
                    <img
                      src={item}
                      alt=""
                      style={{
                        width: '100%',
                        height: 120,
                        objectFit: 'cover',
                        borderRadius: 8,
                        marginBottom: 8,
                        backgroundColor: '#eef1ff',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: 120,
                        borderRadius: 8,
                        backgroundColor: '#eef1ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 8,
                        color: '#6b7385',
                        fontSize: 13,
                      }}
                    >
                      Video
                    </div>
                  )}
                  <div className="ui-muted" style={{ fontSize: 12, wordBreak: 'break-all' }}>
                    {item}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      </section>
    </AdminShell>
  );
}
