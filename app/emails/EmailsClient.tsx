'use client';

import { useState } from 'react';

type EmailLead = {
  id?: number;
  name?: string;
  email?: string;
  source?: string | null;
  created_at?: string;
};

export default function EmailsClient() {
  const [password, setPassword] = useState('');
  const [rows, setRows] = useState<EmailLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [lessonFile, setLessonFile] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('Your lesson from AprenderInglesFull 📘');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfs, setPdfs] = useState<{ key: string; size?: number; lastModified?: string }[]>([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfSearch, setPdfSearch] = useState('');

  const fetchEmails = async () => {
    try {
      setLoading(true);
      setError(null);
      setSendResult(null);

      const res = await fetch('/uploader/api/emails', {
        headers: {
          'x-admin-password': password,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load emails');
      }

      setRows(data.rows || []);
      setSelected({});
    } catch (err: any) {
      setRows([]);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const toggleAll = (checked: boolean) => {
    if (!checked) {
      setSelected({});
      return;
    }
    const map: Record<string, boolean> = {};
    rows.forEach(row => {
      if (row.email) {
        map[row.email] = true;
      }
    });
    setSelected(map);
  };

  const toggleOne = (email: string, checked: boolean) => {
    setSelected(prev => ({ ...prev, [email]: checked }));
  };

  const selectedRecipients = rows.filter(row => row.email && selected[row.email]);
  const filteredPdfs = pdfs.filter(item =>
    item.key.toLowerCase().includes(pdfSearch.trim().toLowerCase()),
  );

  const sendEmails = async () => {
    try {
      setSending(true);
      setError(null);
      setSendResult(null);

      const res = await fetch('/uploader/api/emails/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({
          recipients: selectedRecipients.map(r => ({ name: r.name, email: r.email })),
          lessonFile,
          lessonTitle,
          message,
          subject,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send emails');
      }

      setSendResult(`Sent: ${data.sent}, Failed: ${data.failed}`);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setSending(false);
    }
  };

  const loadPdfs = async () => {
    try {
      setPdfLoading(true);
      setPdfError(null);

      const res = await fetch('/uploader/api/pdfs', {
        headers: {
          'x-admin-password': password,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load PDFs');
      }
      setPdfs(Array.isArray(data.items) ? data.items : []);
    } catch (err: any) {
      setPdfError(err.message || String(err));
      setPdfs([]);
    } finally {
      setPdfLoading(false);
    }
  };

  const openPdfModal = () => {
    setShowPdfModal(true);
    setPdfSearch('');
    loadPdfs();
  };

  const selectPdf = (key: string) => {
    setLessonFile(key);
    setShowPdfModal(false);
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 14, display: 'block', marginBottom: 6 }}>
          Admin password:
        </label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{
            padding: 8,
            minWidth: 240,
            borderRadius: 6,
            border: '1px solid #4b5563',
            backgroundColor: '#020617',
            color: '#e5e7eb',
          }}
        />
        <button
          onClick={fetchEmails}
          disabled={loading || !password}
          style={{
            marginLeft: 10,
            padding: '8px 16px',
            borderRadius: 9999,
            border: 'none',
            backgroundColor: '#2563eb',
            color: 'white',
            fontWeight: 600,
            cursor: loading || !password ? 'not-allowed' : 'pointer',
            opacity: loading || !password ? 0.6 : 1,
          }}
        >
          {loading ? 'Loading…' : 'Load emails'}
        </button>
      </div>

      <div
        style={{
          marginBottom: 20,
          padding: 14,
          borderRadius: 10,
          border: '1px solid #374151',
          backgroundColor: '#0b1220',
        }}
      >
        <div style={{ fontSize: 14, marginBottom: 8, fontWeight: 600 }}>
          Email content
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 13 }}>
            PDF filename (must end in .pdf):
            <br />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
              <input
                type="text"
                value={lessonFile}
                onChange={e => setLessonFile(e.target.value)}
                placeholder="lesson_01.pdf"
                style={{
                  padding: 6,
                  minWidth: 240,
                  borderRadius: 6,
                  border: '1px solid #4b5563',
                  backgroundColor: '#020617',
                  color: '#e5e7eb',
                }}
              />
              <button
                type="button"
                onClick={openPdfModal}
                disabled={!password}
                style={{
                  padding: '6px 12px',
                  borderRadius: 9999,
                  border: '1px solid #1d4ed8',
                  backgroundColor: '#0b1220',
                  color: '#93c5fd',
                  fontWeight: 600,
                  cursor: !password ? 'not-allowed' : 'pointer',
                  opacity: !password ? 0.6 : 1,
                }}
              >
                Browse PDFs
              </button>
            </div>
          </label>
          <label style={{ fontSize: 13 }}>
            Lesson title:
            <br />
            <input
              type="text"
              value={lessonTitle}
              onChange={e => setLessonTitle(e.target.value)}
              placeholder="Your English lesson"
              style={{
                padding: 6,
                minWidth: 260,
                marginTop: 4,
                borderRadius: 6,
                border: '1px solid #4b5563',
                backgroundColor: '#020617',
                color: '#e5e7eb',
              }}
            />
          </label>
        </div>
        <label style={{ fontSize: 13, display: 'block', marginTop: 10 }}>
          Subject:
          <br />
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            style={{
              padding: 6,
              width: '100%',
              maxWidth: 520,
              marginTop: 4,
              borderRadius: 6,
              border: '1px solid #4b5563',
              backgroundColor: '#020617',
              color: '#e5e7eb',
            }}
          />
        </label>
        <label style={{ fontSize: 13, display: 'block', marginTop: 10 }}>
          Extra message (optional):
          <br />
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={5}
            style={{
              padding: 8,
              width: '100%',
              maxWidth: 720,
              marginTop: 4,
              borderRadius: 6,
              border: '1px solid #4b5563',
              backgroundColor: '#020617',
              color: '#e5e7eb',
              resize: 'vertical',
            }}
          />
        </label>
      </div>

      {error && (
        <p style={{ color: '#f87171', marginTop: 8 }}>
          Error: {error}
        </p>
      )}

      {sendResult && (
        <p style={{ color: '#34d399', marginTop: 8 }}>
          {sendResult}
        </p>
      )}

      {rows.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: '1px solid #374151',
              backgroundColor: '#020617',
            }}
          >
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #374151' }}>
                  <input
                    type="checkbox"
                    checked={selectedRecipients.length === rows.length && rows.length > 0}
                    onChange={e => toggleAll(e.target.checked)}
                  />
                </th>
                <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #374151' }}>
                  Name
                </th>
                <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #374151' }}>
                  Email
                </th>
                <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #374151' }}>
                  Source
                </th>
                <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #374151' }}>
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.id ?? `${row.email}-${idx}`}>
                  <td style={{ padding: 10, borderBottom: '1px solid #1f2937' }}>
                    {row.email && (
                      <input
                        type="checkbox"
                        checked={!!selected[row.email]}
                        onChange={e => toggleOne(row.email!, e.target.checked)}
                      />
                    )}
                  </td>
                  <td style={{ padding: 10, borderBottom: '1px solid #1f2937' }}>
                    {row.name || '—'}
                  </td>
                  <td style={{ padding: 10, borderBottom: '1px solid #1f2937' }}>
                    {row.email || '—'}
                  </td>
                  <td style={{ padding: 10, borderBottom: '1px solid #1f2937' }}>
                    {row.source || '—'}
                  </td>
                  <td style={{ padding: 10, borderBottom: '1px solid #1f2937' }}>
                    {row.created_at ? new Date(row.created_at).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <button
            onClick={sendEmails}
            disabled={
              sending ||
              !password ||
              selectedRecipients.length === 0 ||
              !lessonFile.trim()
            }
            style={{
              padding: '10px 18px',
              borderRadius: 9999,
              border: 'none',
              backgroundColor: '#f97316',
              color: 'white',
              fontWeight: 600,
              cursor:
                sending || !password || selectedRecipients.length === 0 || !lessonFile.trim()
                  ? 'not-allowed'
                  : 'pointer',
              opacity:
                sending || !password || selectedRecipients.length === 0 || !lessonFile.trim()
                  ? 0.6
                  : 1,
            }}
          >
            {sending
              ? 'Sending…'
              : `Send to selected (${selectedRecipients.length})`}
          </button>
        </div>
      )}

      {rows.length === 0 && !loading && !error && (
        <p style={{ color: '#9ca3af' }}>No emails loaded yet.</p>
      )}

      {showPdfModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(2, 6, 23, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 50,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 720,
              backgroundColor: '#0b1220',
              borderRadius: 12,
              border: '1px solid #1f2937',
              padding: 16,
              color: '#e5e7eb',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Select a PDF</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>
                  Choose a file from the S3 bucket.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPdfModal(false)}
                style={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#9ca3af',
                  fontSize: 18,
                  cursor: 'pointer',
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div style={{ marginTop: 12, marginBottom: 10 }}>
              <input
                type="text"
                value={pdfSearch}
                onChange={e => setPdfSearch(e.target.value)}
                placeholder="Search PDFs..."
                style={{
                  padding: 8,
                  width: '100%',
                  borderRadius: 8,
                  border: '1px solid #374151',
                  backgroundColor: '#020617',
                  color: '#e5e7eb',
                }}
              />
            </div>

            {pdfLoading && <div style={{ fontSize: 13 }}>Loading PDFs…</div>}
            {pdfError && <div style={{ color: '#f87171', fontSize: 13 }}>Error: {pdfError}</div>}

            {!pdfLoading && !pdfError && (
              <div style={{ maxHeight: 360, overflowY: 'auto', marginTop: 6 }}>
                {filteredPdfs.map(item => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => selectPdf(item.key)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: '1px solid #1f2937',
                        backgroundColor: '#0f172a',
                        color: '#e5e7eb',
                        marginBottom: 8,
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{item.key}</div>
                      {item.lastModified && (
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>
                          Updated {new Date(item.lastModified).toLocaleString()}
                          {typeof item.size === 'number'
                            ? ` • ${(item.size / 1024).toFixed(1)} KB`
                            : ''}
                        </div>
                      )}
                    </button>
                  ))}
                {filteredPdfs.length === 0 && (
                  <div style={{ fontSize: 13, color: '#9ca3af' }}>
                    No PDFs found.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
