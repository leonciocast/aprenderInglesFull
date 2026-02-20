'use client';

import EmailsClient from './EmailsClient';
import AdminShell from '../admin/AdminShell';

export default function EmailsPage() {
  return (
    <AdminShell title="Email Leads" hideHero hidePanelHeader>
      <EmailsClient />
    </AdminShell>
  );
}
