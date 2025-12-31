'use client';

import EmailsClient from './EmailsClient';
import AdminShell from '../admin/AdminShell';

export default function EmailsPage() {
  return (
    <AdminShell
      title="Email Leads"
      description="Load the latest email leads from the Booktol database."
    >
      <section className="admin-panel">
        <EmailsClient />
      </section>
    </AdminShell>
  );
}
