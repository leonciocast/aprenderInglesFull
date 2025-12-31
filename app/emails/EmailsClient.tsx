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
    <div className="emails-page">
      <div className="emails-toolbar">
        <label className="emails-label">
          Admin password:
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="ui-input emails-input"
          />
        </label>
        <button
          onClick={fetchEmails}
          disabled={loading || !password}
          className="ui-button ui-button-primary"
        >
          {loading ? 'Loading…' : 'Load emails'}
        </button>
      </div>

      <div className="emails-card ui-card">
        <div className="emails-card__title">Email content</div>
        <div className="emails-row">
          <label className="emails-label">
            PDF filename (must end in .pdf):
            <div className="emails-inline">
              <input
                type="text"
                value={lessonFile}
                onChange={e => setLessonFile(e.target.value)}
                placeholder="lesson_01.pdf"
                className="ui-input"
              />
              <button
                type="button"
                onClick={openPdfModal}
                disabled={!password}
                className="ui-button ui-button-outline"
              >
                Browse PDFs
              </button>
            </div>
          </label>
          <label className="emails-label">
            Lesson title:
            <input
              type="text"
              value={lessonTitle}
              onChange={e => setLessonTitle(e.target.value)}
              placeholder="Your English lesson"
              className="ui-input"
            />
          </label>
        </div>
        <label className="emails-label emails-label--full">
          Subject:
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="ui-input"
          />
        </label>
        <label className="emails-label emails-label--full">
          Extra message (optional):
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={5}
            className="ui-textarea emails-textarea"
          />
        </label>
      </div>

      {error && <p className="emails-error">Error: {error}</p>}
      {sendResult && <p className="emails-success">{sendResult}</p>}

      {rows.length > 0 && (
        <div className="emails-table">
          <table className="emails-table__table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedRecipients.length === rows.length && rows.length > 0}
                    onChange={e => toggleAll(e.target.checked)}
                  />
                </th>
                <th>Name</th>
                <th>Email</th>
                <th>Source</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.id ?? `${row.email}-${idx}`}>
                  <td>
                    {row.email && (
                      <input
                        type="checkbox"
                        checked={!!selected[row.email]}
                        onChange={e => toggleOne(row.email!, e.target.checked)}
                      />
                    )}
                  </td>
                  <td>{row.name || '—'}</td>
                  <td>{row.email || '—'}</td>
                  <td>{row.source || '—'}</td>
                  <td>{row.created_at ? new Date(row.created_at).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > 0 && (
        <div className="emails-actions">
          <button
            onClick={sendEmails}
            disabled={
              sending ||
              !password ||
              selectedRecipients.length === 0 ||
              !lessonFile.trim()
            }
            className="ui-button ui-button-primary"
          >
            {sending ? 'Sending…' : `Send to selected (${selectedRecipients.length})`}
          </button>
        </div>
      )}

      {rows.length === 0 && !loading && !error && (
        <p className="emails-empty">No emails loaded yet.</p>
      )}

      {showPdfModal && (
        <div className="emails-modal">
          <div className="emails-modal__content">
            <div className="emails-modal__header">
              <div>
                <div className="emails-modal__title">Select a PDF</div>
                <div className="emails-modal__subtitle">Choose a file from the S3 bucket.</div>
              </div>
              <button
                type="button"
                onClick={() => setShowPdfModal(false)}
                className="emails-modal__close"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="emails-modal__search">
              <input
                type="text"
                value={pdfSearch}
                onChange={e => setPdfSearch(e.target.value)}
                placeholder="Search PDFs..."
                className="ui-input"
              />
            </div>

            {pdfLoading && <div className="emails-muted">Loading PDFs…</div>}
            {pdfError && <div className="emails-error">Error: {pdfError}</div>}

            {!pdfLoading && !pdfError && (
              <div className="emails-modal__list">
                {filteredPdfs.map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => selectPdf(item.key)}
                    className="emails-modal__item"
                  >
                    <div className="emails-modal__item-title">{item.key}</div>
                    {item.lastModified && (
                      <div className="emails-modal__item-meta">
                        Updated {new Date(item.lastModified).toLocaleString()}
                        {typeof item.size === 'number'
                          ? ` • ${(item.size / 1024).toFixed(1)} KB`
                          : ''}
                      </div>
                    )}
                  </button>
                ))}
                {filteredPdfs.length === 0 && (
                  <div className="emails-muted">No PDFs found.</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
