'use client';

import { useState } from 'react';
import AdminShell from '../AdminShell';

type Course = {
  id: number;
  title: string;
};

type Student = {
  id: number;
  email: string;
  name?: string;
};

export default function EnrollmentsAdminPage() {
  const [password, setPassword] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courseStudents, setCourseStudents] = useState<Record<number, Student[]>>({});
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [studentSelection, setStudentSelection] = useState<Record<number, boolean>>({});
  const [studentSearch, setStudentSearch] = useState('');
  const [coursePickerOpen, setCoursePickerOpen] = useState(false);
  const [courseSearch, setCourseSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/uploader/api/admin/students', {
        headers: { 'x-admin-password': password },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load students');
      setStudents(data.students || []);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const loadCourseStudents = async (courseId: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/uploader/api/admin/courses/${courseId}/students`, {
        headers: { 'x-admin-password': password },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load enrolled students');
      setCourseStudents(prev => ({ ...prev, [courseId]: data.students || [] }));
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (id: number) => {
    setStudentSelection(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const enrollSelected = async () => {
    if (!selectedCourseId) {
      setError('Select a course first.');
      return;
    }
    const selectedEmails = students
      .filter(item => studentSelection[item.id])
      .map(item => item.email);
    if (selectedEmails.length === 0) {
      setError('Select at least one student.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/uploader/api/admin/enrollments', {
        method: 'POST',
        headers: {
          'x-admin-password': password,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: selectedCourseId,
          emails: selectedEmails,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to enroll students');
      setStudentSelection({});
      loadCourseStudents(selectedCourseId);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(item => {
    const term = studentSearch.trim().toLowerCase();
    if (!term) return true;
    return (
      item.email.toLowerCase().includes(term) ||
      (item.name || '').toLowerCase().includes(term)
    );
  });

  const filteredCourses = courses.filter(course => {
    const term = courseSearch.trim().toLowerCase();
    if (!term) return true;
    return course.title.toLowerCase().includes(term);
  });

  const selectedCourse = courses.find(course => course.id === selectedCourseId);

  return (
    <AdminShell
      title="Enrollments"
      description="Assign students to courses and review enrollment lists."
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
          onClick={loadCourses}
          disabled={!password || loading}
          className="ui-button ui-button-primary"
          style={{ marginLeft: 12 }}
        >
          Load courses
        </button>
        <button
          type="button"
          onClick={loadStudents}
          disabled={!password || loading}
          className="ui-button ui-button-outline"
          style={{ marginLeft: 8 }}
        >
          Load students
        </button>
      </div>

      {error && <p style={{ color: '#f87171', marginBottom: 16 }}>{error}</p>}

      <section className="ui-card" style={{ padding: 16, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12, color: '#192335' }}>Select course</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setCoursePickerOpen(true)}
            disabled={!password}
            className="ui-input"
            style={{
              minWidth: 280,
              textAlign: 'left',
              cursor: !password ? 'not-allowed' : 'pointer',
            }}
          >
            {selectedCourse ? selectedCourse.title : 'Choose a course'}
          </button>
          <button
            type="button"
            onClick={() => selectedCourseId && loadCourseStudents(selectedCourseId)}
            disabled={!selectedCourseId || loading}
            className="ui-button ui-button-outline"
          >
            Load enrolled students
          </button>
        </div>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)',
          gap: 16,
        }}
      >
        <div className="ui-card" style={{ padding: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#192335' }}>
            Students
          </div>
          <input
            type="text"
            placeholder="Search by name or email"
            value={studentSearch}
            onChange={e => setStudentSearch(e.target.value)}
            className="ui-input"
            style={{ marginBottom: 12 }}
          />
          <div style={{ display: 'grid', gap: 8, maxHeight: 360, overflow: 'auto' }}>
            {filteredStudents.map(student => (
              <label
                key={student.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: 10,
                  borderRadius: 10,
                  border: '1px solid #e6e3f1',
                  backgroundColor: '#f6f8ff',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={!!studentSelection[student.id]}
                  onChange={() => toggleStudent(student.id)}
                />
                <div>
                  <div style={{ fontWeight: 600, color: '#192335' }}>
                    {student.name || 'Student'}
                  </div>
                  <div className="ui-muted" style={{ fontSize: 12 }}>
                    {student.email}
                  </div>
                </div>
              </label>
            ))}
            {filteredStudents.length === 0 && (
              <div className="ui-muted">No students found.</div>
            )}
          </div>
          <button
            type="button"
            onClick={enrollSelected}
            disabled={!selectedCourseId || loading}
            className="ui-button ui-button-primary"
            style={{ marginTop: 12 }}
          >
            Enroll selected
          </button>
        </div>

        <div className="ui-card" style={{ padding: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#192335' }}>
            Enrolled in course
          </div>
          {selectedCourseId ? (
            <ul style={{ paddingLeft: 18 }}>
              {(courseStudents[selectedCourseId] || []).map(student => (
                <li key={student.id} style={{ marginBottom: 6 }}>
                  {student.name ? `${student.name} — ` : ''}
                  {student.email}
                </li>
              ))}
              {(courseStudents[selectedCourseId] || []).length === 0 && (
                <li className="ui-muted">No students enrolled yet.</li>
              )}
            </ul>
          ) : (
            <div className="ui-muted">Select a course to view.</div>
          )}
        </div>
      </section>

      {coursePickerOpen && (
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
              maxWidth: 720,
              maxHeight: '80vh',
              overflow: 'auto',
              padding: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#192335' }}>
                Select a course
              </div>
              <button
                type="button"
                onClick={() => setCoursePickerOpen(false)}
                className="ui-button ui-button-outline"
                style={{ padding: '6px 12px' }}
                aria-label="Close"
              >
                Close
              </button>
            </div>

            <input
              type="text"
              placeholder="Search course by title"
              value={courseSearch}
              onChange={e => setCourseSearch(e.target.value)}
              className="ui-input"
              style={{ marginBottom: 12 }}
            />

            <div style={{ display: 'grid', gap: 8 }}>
              {filteredCourses.map(course => (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => {
                    setSelectedCourseId(course.id);
                    setCoursePickerOpen(false);
                    loadCourseStudents(course.id);
                  }}
                  className="lesson-item"
                  style={{
                    textAlign: 'left',
                    backgroundColor:
                      selectedCourseId === course.id ? '#eef1ff' : '#f7f8ff',
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#192335' }}>{course.title}</div>
                </button>
              ))}
              {filteredCourses.length === 0 && (
                <div className="ui-muted">No courses found.</div>
              )}
            </div>
          </div>
        </div>
      )}
      </section>
    </AdminShell>
  );
}
