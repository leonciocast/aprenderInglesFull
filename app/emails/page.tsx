import EmailsClient from './EmailsClient';

export default function EmailsPage() {
  return (
    <main
      style={{
        padding: 24,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        maxWidth: 1100,
        margin: '0 auto',
        minHeight: '100vh',
        backgroundColor: '#020617',
        color: '#e5e7eb',
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Email Leads</h1>
      <p style={{ marginBottom: 16, maxWidth: 720 }}>
        Load the latest email leads from the Booktol database.
      </p>
      <EmailsClient />
    </main>
  );
}
