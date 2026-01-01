'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminShell from '../AdminShell';

type Quiz = {
  id: number;
  title: string;
  description?: string;
  course_id?: number | null;
  lesson_id?: number | null;
  course_title?: string | null;
  lesson_title?: string | null;
};

type Course = {
  id: number;
  title: string;
};

type Lesson = {
  id: number;
  title: string;
  lesson_order: number;
};

type Question = {
  id: number;
  text: string;
  order: number;
  options: { id: number; text: string; is_correct?: boolean }[];
};

export default function AdminQuizzesPage() {
  const [password, setPassword] = useState('');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessonsByCourse, setLessonsByCourse] = useState<Record<number, Lesson[]>>({});
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<{
    text: string;
    options: { id: number; text: string }[];
    correctOptionId: string;
  }>({ text: '', options: [], correctOptionId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newQuiz, setNewQuiz] = useState({
    title: '',
    description: '',
    courseId: '',
    lessonId: '',
  });

  const [questionDraft, setQuestionDraft] = useState({
    text: '',
    optionA: '',
    optionB: '',
    optionC: '',
    correctIndex: '0',
  });

  const selectedCourseId = Number(newQuiz.courseId);
  const lessonsForCourse = useMemo(
    () => (Number.isFinite(selectedCourseId) ? lessonsByCourse[selectedCourseId] || [] : []),
    [lessonsByCourse, selectedCourseId],
  );

  const loadCourses = async () => {
    const res = await fetch('/uploader/api/admin/courses', {
      headers: { 'x-admin-password': password },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load courses');
    setCourses(data.courses || []);
  };

  const loadQuizzes = async () => {
    const res = await fetch('/uploader/api/admin/quizzes', {
      headers: { 'x-admin-password': password },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load quizzes');
    setQuizzes(data.quizzes || []);
  };

  const loadLessons = async (courseId: number) => {
    const res = await fetch(`/uploader/api/admin/courses/${courseId}/lessons`, {
      headers: { 'x-admin-password': password },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load lessons');
    setLessonsByCourse(prev => ({ ...prev, [courseId]: data.lessons || [] }));
  };

  const loadQuizDetails = async (quizId: number) => {
    const res = await fetch(`/uploader/api/admin/quizzes/${quizId}`, {
      headers: { 'x-admin-password': password },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load quiz');
    setQuestions(data.questions || []);
  };

  const handleLoadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([loadCourses(), loadQuizzes()]);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = async (value: string) => {
    setNewQuiz(prev => ({ ...prev, courseId: value, lessonId: '' }));
    const courseId = Number(value);
    if (Number.isFinite(courseId)) {
      try {
        await loadLessons(courseId);
      } catch (err: any) {
        setError(err.message || String(err));
      }
    }
  };

  const createQuiz = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/uploader/api/admin/quizzes', {
        method: 'POST',
        headers: {
          'x-admin-password': password,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newQuiz.title,
          description: newQuiz.description,
          courseId: newQuiz.courseId ? Number(newQuiz.courseId) : null,
          lessonId: newQuiz.lessonId ? Number(newQuiz.lessonId) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create quiz');
      setQuizzes(prev => [data.quiz, ...prev]);
      setNewQuiz({ title: '', description: '', courseId: '', lessonId: '' });
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = async () => {
    if (!selectedQuizId) return;
    const options = [questionDraft.optionA, questionDraft.optionB, questionDraft.optionC].map(text =>
      text.trim(),
    );
    const correctIndex = Number(questionDraft.correctIndex);
    if (!questionDraft.text.trim() || options.some(text => !text)) {
      setError('Completa la pregunta y las 3 opciones.');
      return;
    }
    if (![0, 1, 2].includes(correctIndex)) {
      setError('Selecciona cuál opción es correcta.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/uploader/api/admin/quizzes/${selectedQuizId}/questions`, {
        method: 'POST',
        headers: {
          'x-admin-password': password,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: questionDraft.text,
          options,
          correctIndex,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add question');
      if (data.question) {
        setQuestions(prev => [...prev, data.question]);
      } else {
        await loadQuizDetails(selectedQuizId);
      }
      setQuestionDraft({ text: '', optionA: '', optionB: '', optionC: '', correctIndex: '0' });
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (question: Question) => {
    const correct = question.options.find(option => option.is_correct);
    setEditingQuestionId(question.id);
    setEditDraft({
      text: question.text,
      options: question.options.map(option => ({ id: option.id, text: option.text })),
      correctOptionId: correct ? String(correct.id) : question.options[0] ? String(question.options[0].id) : '',
    });
  };

  const updateEditOption = (index: number, value: string) => {
    setEditDraft(prev => {
      const options = [...prev.options];
      if (options[index]) {
        options[index] = { ...options[index], text: value };
      }
      return { ...prev, options };
    });
  };

  const saveEdit = async () => {
    if (!editingQuestionId) return;
    const trimmedText = editDraft.text.trim();
    const trimmedOptions = editDraft.options.map(option => ({
      id: option.id,
      text: option.text.trim(),
    }));
    const correctOptionId = Number(editDraft.correctOptionId);

    if (!trimmedText || trimmedOptions.some(option => !option.text)) {
      setError('Completa la pregunta y todas las opciones.');
      return;
    }
    if (!Number.isFinite(correctOptionId)) {
      setError('Selecciona la opción correcta.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/uploader/api/admin/quizzes/questions/${editingQuestionId}`, {
        method: 'PUT',
        headers: {
          'x-admin-password': password,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: trimmedText,
          options: trimmedOptions,
          correctOptionId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update question');
      setQuestions(prev =>
        prev.map(question => (question.id === editingQuestionId ? data.question : question)),
      );
      setEditingQuestionId(null);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedQuizId) {
      setQuestions([]);
      return;
    }
    loadQuizDetails(selectedQuizId).catch(err => setError(err.message || String(err)));
  }, [selectedQuizId]);

  return (
    <AdminShell
      title="Quiz Manager"
      description="Create quizzes, attach them to courses or lessons, and add questions."
    >
      <section className="admin-panel">
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
            onClick={handleLoadAll}
            disabled={!password || loading}
            className="ui-button ui-button-primary"
            style={{ marginLeft: 12 }}
          >
            Load quizzes
          </button>
        </div>

        {error && <p style={{ color: '#f87171', marginBottom: 16 }}>{error}</p>}

        <section className="ui-card" style={{ padding: 16, marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, marginBottom: 12, color: '#192335' }}>Create quiz</h3>
          <div style={{ display: 'grid', gap: 10 }}>
            <input
              type="text"
              placeholder="Quiz title"
              value={newQuiz.title}
              onChange={e => setNewQuiz(prev => ({ ...prev, title: e.target.value }))}
              className="ui-input"
            />
            <textarea
              placeholder="Description (optional)"
              value={newQuiz.description}
              onChange={e => setNewQuiz(prev => ({ ...prev, description: e.target.value }))}
              className="ui-input"
              rows={3}
            />
            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <label>
                Course (optional)
                <select
                  className="ui-input"
                  value={newQuiz.courseId}
                  onChange={e => handleCourseChange(e.target.value)}
                >
                  <option value="">Sin curso</option>
                  {courses.map(course => (
                    <option key={course.id} value={String(course.id)}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Lesson (optional)
                <select
                  className="ui-input"
                  value={newQuiz.lessonId}
                  onChange={e => setNewQuiz(prev => ({ ...prev, lessonId: e.target.value }))}
                  disabled={!Number.isFinite(selectedCourseId)}
                >
                  <option value="">Sin leccion</option>
                  {lessonsForCourse.map(lesson => (
                    <option key={lesson.id} value={String(lesson.id)}>
                      {lesson.lesson_order}. {lesson.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="button"
              className="ui-button ui-button-primary"
              onClick={createQuiz}
              disabled={loading || !newQuiz.title.trim()}
            >
              Crear quiz
            </button>
          </div>
        </section>

        <section className="admin-panel" style={{ padding: 0 }}>
          <div className="admin-panel__header">
            <h2>Quizzes</h2>
            <span className="admin-panel__meta">{quizzes.length} total</span>
          </div>
          <div className="admin-table">
            <div className="admin-table__row admin-table__head">
              <span>Title</span>
              <span>Scope</span>
              <span>Action</span>
            </div>
            {quizzes.map(quiz => (
              <div key={quiz.id} className="admin-table__row">
                <span className="admin-table__course">{quiz.title}</span>
                <span>
                  {quiz.lesson_title
                    ? `Lesson: ${quiz.lesson_title}${quiz.course_title ? ` · Course: ${quiz.course_title}` : ''}`
                    : quiz.course_title
                      ? `Course: ${quiz.course_title}`
                      : 'General'}
                </span>
                <span>
                  <button
                    type="button"
                    className="ui-button ui-button-secondary"
                    onClick={() => setSelectedQuizId(quiz.id)}
                  >
                    Edit questions
                  </button>
                </span>
              </div>
            ))}
            {quizzes.length === 0 && !loading && (
              <div className="admin-table__row">
                <span>No quizzes yet.</span>
              </div>
            )}
          </div>
        </section>

        {selectedQuizId && (
          <section className="ui-card" style={{ padding: 16, marginTop: 24 }}>
            <h3 style={{ fontSize: 18, marginBottom: 12, color: '#192335' }}>
              Add questions
            </h3>
            <div style={{ display: 'grid', gap: 10 }}>
              <textarea
                placeholder="Question"
                value={questionDraft.text}
                onChange={e => setQuestionDraft(prev => ({ ...prev, text: e.target.value }))}
                className="ui-input"
                rows={2}
              />
              <input
                type="text"
                placeholder="Option A"
                value={questionDraft.optionA}
                onChange={e => setQuestionDraft(prev => ({ ...prev, optionA: e.target.value }))}
                className="ui-input"
              />
              <input
                type="text"
                placeholder="Option B"
                value={questionDraft.optionB}
                onChange={e => setQuestionDraft(prev => ({ ...prev, optionB: e.target.value }))}
                className="ui-input"
              />
              <input
                type="text"
                placeholder="Option C"
                value={questionDraft.optionC}
                onChange={e => setQuestionDraft(prev => ({ ...prev, optionC: e.target.value }))}
                className="ui-input"
              />
              <label>
                Correct option
                <select
                  className="ui-input"
                  value={questionDraft.correctIndex}
                  onChange={e => setQuestionDraft(prev => ({ ...prev, correctIndex: e.target.value }))}
                >
                  <option value="0">Option A</option>
                  <option value="1">Option B</option>
                  <option value="2">Option C</option>
                </select>
              </label>
              <button
                type="button"
                className="ui-button ui-button-primary"
                onClick={addQuestion}
                disabled={loading}
              >
                Add question
              </button>
            </div>

            <div style={{ marginTop: 16 }}>
              <h4 style={{ marginBottom: 8, color: '#192335' }}>Current questions</h4>
              {questions.length === 0 && <p className="ui-muted">No questions yet.</p>}
              {questions.map(question => (
                <div key={question.id} style={{ marginBottom: 12 }}>
                  {editingQuestionId === question.id ? (
                    <div style={{ display: 'grid', gap: 8 }}>
                      <input
                        type="text"
                        className="ui-input"
                        value={editDraft.text}
                        onChange={e => setEditDraft(prev => ({ ...prev, text: e.target.value }))}
                      />
                      {editDraft.options.map((option, index) => (
                        <input
                          key={option.id}
                          type="text"
                          className="ui-input"
                          value={option.text}
                          onChange={e => updateEditOption(index, e.target.value)}
                        />
                      ))}
                      <label>
                        Correct option
                        <select
                          className="ui-input"
                          value={editDraft.correctOptionId}
                          onChange={e => setEditDraft(prev => ({ ...prev, correctOptionId: e.target.value }))}
                        >
                          {editDraft.options.map(option => (
                            <option key={option.id} value={String(option.id)}>
                              {option.text || 'Option'}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          className="ui-button ui-button-primary"
                          onClick={saveEdit}
                          disabled={loading}
                        >
                          Save changes
                        </button>
                        <button
                          type="button"
                          className="ui-button ui-button-secondary"
                          onClick={() => setEditingQuestionId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <strong>{question.order}. {question.text}</strong>
                      <ul style={{ marginTop: 6, paddingLeft: 18 }}>
                        {(question.options || []).map(option => (
                          <li key={option.id}>
                            {option.text}
                            {option.is_correct ? ' ✅' : ''}
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        className="ui-button ui-button-secondary"
                        onClick={() => startEdit(question)}
                        style={{ marginTop: 6 }}
                      >
                        Edit question
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </section>
    </AdminShell>
  );
}
