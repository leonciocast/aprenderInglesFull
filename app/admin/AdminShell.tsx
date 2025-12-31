'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const primaryLinks = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Admin Courses', href: '/admin/courses' },
  { label: 'Admin Enrollments', href: '/admin/enrollments' },
  { label: 'Email Leads', href: '/emails' },
  { label: 'Uploader', href: '/uploader' },
  { label: 'Courses', href: '/courses' },
  { label: 'Login', href: '/auth/login' },
  { label: 'Register', href: '/auth/register' },
];

const allRoutes = [
  { label: 'Home', href: '/' },
  { label: 'Lesson Preview', href: '/lesson' },
  { label: 'Courses', href: '/courses' },
  { label: 'Course Detail', href: '/courses/:courseId' },
  { label: 'Lesson Detail', href: '/courses/:courseId/lessons/:lessonId' },
  { label: 'Uploader', href: '/uploader' },
  { label: 'Emails', href: '/emails' },
  { label: 'Admin Dashboard', href: '/admin' },
  { label: 'Admin Courses', href: '/admin/courses' },
  { label: 'Admin Enrollments', href: '/admin/enrollments' },
  { label: 'Auth Login', href: '/auth/login' },
  { label: 'Auth Register', href: '/auth/register' },
  { label: 'Auth Verify', href: '/auth/verify' },
  { label: 'Auth Reset', href: '/auth/reset' },
  { label: 'Auth Forgot', href: '/auth/forgot' },
];

type AdminShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export default function AdminShell({ title, description, children }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="admin-dashboard">
      <section className="admin-hero">
        <div className="admin-hero__glow" aria-hidden="true" />
        <div className="admin-hero__card">
          <div className="admin-hero__profile">
            <div className="admin-hero__avatar">JD</div>
            <div>
              <div className="admin-hero__name">Admin</div>
              <div className="admin-hero__rating">
                <span aria-hidden="true">★★★★★</span>
                <span className="admin-hero__rating-count">(15 Reviews)</span>
              </div>
            </div>
          </div>
          <Link className="admin-hero__button" href="/admin/courses">
            Create a New Course
          </Link>
        </div>
      </section>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar__section">
            <div className="admin-sidebar__eyebrow">Welcome, Admin</div>
            <h3 className="admin-sidebar__title">Admin Menu</h3>
            <ul className="admin-sidebar__list">
              {primaryLinks.map(link => (
                <li key={link.href}>
                  <Link
                    className={`admin-sidebar__link${pathname === link.href ? ' is-active' : ''}`}
                    href={link.href}
                  >
                    <span className="admin-sidebar__dot" aria-hidden="true" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="admin-sidebar__section">
            <div className="admin-sidebar__eyebrow">All Routes</div>
            <ul className="admin-sidebar__routes">
              {allRoutes.map(route => (
                <li key={`${route.href}-${route.label}`}>
                  <Link className="admin-sidebar__route" href={route.href}>
                    <span>{route.label}</span>
                    <span className="admin-sidebar__route-path">{route.href}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="admin-sidebar__hint">Routes with :id are placeholders.</div>
          </div>
        </aside>

        <main className="admin-content">
          <section className="admin-panel">
            <div className="admin-panel__header">
              <h2>{title}</h2>
              <span className="admin-panel__meta">Admin</span>
            </div>
            {description && <p className="ui-muted">{description}</p>}
          </section>
          {children}
        </main>
      </div>
    </div>
  );
}
