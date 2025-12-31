'use client';

import Link from 'next/link';
import AdminShell from './AdminShell';

const stats = [
  { label: 'Enrolled Courses', value: '30', tone: 'blue' },
  { label: 'Active Courses', value: '10', tone: 'lilac' },
  { label: 'Completed Courses', value: '7', tone: 'violet' },
  { label: 'Total Students', value: '160', tone: 'rose' },
  { label: 'Total Courses', value: '20', tone: 'coral' },
  { label: 'Total Earnings', value: '25,000+', tone: 'amber' },
];

const courseRows = [
  { name: 'Accounting', enrolled: '50', rating: 5 },
  { name: 'Marketing', enrolled: '40', rating: 5 },
  { name: 'Web Design', enrolled: '75', rating: 5 },
  { name: 'Graphic', enrolled: '20', rating: 2 },
];

export default function AdminDashboardPage() {
  return (
    <AdminShell title="Dashboard" description="Instructor overview and quick shortcuts.">
      <section className="admin-panel">
        <div className="admin-panel__header">
          <h2>Overview</h2>
          <span className="admin-panel__meta">Stats</span>
        </div>
        <div className="admin-stats">
          {stats.map(card => (
            <div key={card.label} className={`admin-stat admin-stat--${card.tone}`}>
              <div className="admin-stat__value">{card.value}</div>
              <div className="admin-stat__label">{card.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel__header">
          <h2>My Courses</h2>
          <Link className="admin-panel__link" href="/admin/courses">
            Browse All Courses →
          </Link>
        </div>
        <div className="admin-table">
          <div className="admin-table__row admin-table__head">
            <span>Course Name</span>
            <span>Enrolled</span>
            <span>Rating</span>
          </div>
          {courseRows.map(course => (
            <div key={course.name} className="admin-table__row">
              <span className="admin-table__course">{course.name}</span>
              <span>{course.enrolled}</span>
              <span className="admin-table__rating">
                {'★★★★★'.slice(0, course.rating)}
                <span className="admin-table__rating-off">{'★★★★★'.slice(course.rating)}</span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
