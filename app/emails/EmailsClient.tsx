'use client';

import { useEffect, useState } from 'react';

type EmailLead = {
  id?: number;
  name?: string;
  email?: string;
  source?: string | null;
  created_at?: string;
};

type ResourceMapping = {
  id?: number;
  slug: string;
  title: string;
  file: string;
  created_at?: string;
};

const defaultSubjectFor = (title: string) => `Tu PDF: ${title}`;
const defaultMessageFor = (title: string) =>
  `Hola,\n\n` +
  (title ? `Aquí tienes tu PDF "${title}".\n\n` : 'Aquí tienes tu PDF.\n\n') +
  `En los próximos días te enviaré lecciones cortas, tips y ejercicios para que hables inglés más natural en la vida real.\n\n` +
  `Si tienes alguna pregunta, responde este correo y con gusto te ayudo.\n\n` +
  `— AprenderInglesFull`;

export default function EmailsClient() {
  const [activeTab, setActiveTab] = useState<'emails' | 'manychat'>('emails');
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [rows, setRows] = useState<EmailLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [lessonFile, setLessonFile] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [message, setMessage] = useState(defaultMessageFor(''));
  const [subject, setSubject] = useState('Tu PDF de AprenderInglesFull 📘');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfs, setPdfs] = useState<{ key: string; size?: number; lastModified?: string }[]>([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfSearch, setPdfSearch] = useState('');
  const [resourceRows, setResourceRows] = useState<ResourceMapping[]>([]);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [resourceError, setResourceError] = useState<string | null>(null);
  const [resourceSlug, setResourceSlug] = useState('');
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceFile, setResourceFile] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [manychatTestMode, setManychatTestMode] = useState(false);
  const [manychatModeLoading, setManychatModeLoading] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [sortKey, setSortKey] = useState<'name' | 'email' | 'source' | 'created_at'>(
    'created_at',
  );
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const hydrateAuth = async () => {
      try {
        const res = await fetch('/uploader/api/emails/session');
        const data = await res.json();
        if (res.ok && data?.ok) {
          setAuthed(true);
          await fetchEmails();
        }
      } catch {
        setAuthed(false);
      }
    };
    hydrateAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!authed || activeTab !== 'manychat') return;
    loadManychatMode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, activeTab]);

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

  const login = async () => {
    try {
      setAuthError(null);
      const res = await fetch('/uploader/api/emails/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }
      setAuthed(true);
      await fetchEmails();
    } catch (err: any) {
      setAuthed(false);
      setAuthError(err.message || String(err));
    }
  };

  const logout = async () => {
    await fetch('/uploader/api/emails/session', { method: 'DELETE' });
    setAuthed(false);
    setPassword('');
    setRows([]);
    setSelected({});
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
  const normalizedSearch = tableSearch.trim().toLowerCase();
  const filteredRows = rows.filter(row => {
    if (!normalizedSearch) return true;
    return [
      row.name || '',
      row.email || '',
      row.source || '',
      row.created_at || '',
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalizedSearch);
  });
  const sortedRows = [...filteredRows].sort((a, b) => {
    const aVal = String(a[sortKey] || '');
    const bVal = String(b[sortKey] || '');
    if (sortKey === 'created_at') {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return sortDir === 'asc' ? aTime - bTime : bTime - aTime;
    }
    return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  });

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

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
        headers: password ? { 'x-admin-password': password } : undefined,
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

  const loadResources = async () => {
    try {
      setResourceLoading(true);
      setResourceError(null);
      const res = await fetch('/uploader/api/resources', {
        headers: password ? { 'x-admin-password': password } : undefined,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load resources');
      }
      setResourceRows(Array.isArray(data.rows) ? data.rows : []);
    } catch (err: any) {
      setResourceError(err.message || String(err));
      setResourceRows([]);
    } finally {
      setResourceLoading(false);
    }
  };

  const loadManychatMode = async () => {
    try {
      setManychatModeLoading(true);
      const res = await fetch('/uploader/api/manychat/mode', {
        headers: password ? { 'x-admin-password': password } : undefined,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load ManyChat mode');
      }
      setManychatTestMode(Boolean(data?.enabled));
    } catch (err: any) {
      setResourceError(err.message || String(err));
    } finally {
      setManychatModeLoading(false);
    }
  };

  const setManychatMode = async (enabled: boolean) => {
    try {
      setManychatModeLoading(true);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (password) headers['x-admin-password'] = password;
      const res = await fetch('/uploader/api/manychat/mode', {
        method: 'POST',
        headers,
        body: JSON.stringify({ enabled }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update ManyChat mode');
      }
      setManychatTestMode(Boolean(data?.enabled));
    } catch (err: any) {
      setResourceError(err.message || String(err));
    } finally {
      setManychatModeLoading(false);
    }
  };

  const openPdfModal = () => {
    setShowPdfModal(true);
    setPdfSearch('');
    setResourceSlug('');
    setResourceTitle('');
    setResourceFile('');
    loadPdfs();
    loadResources();
    loadManychatMode();
  };

  const selectPdf = (key: string) => {
    setLessonFile(key);
    setShowPdfModal(false);
  };

  const selectResource = (resource: ResourceMapping) => {
    setLessonFile(resource.file);
    setLessonTitle(resource.title);
    setSubject(defaultSubjectFor(resource.title));
    setMessage(defaultMessageFor(resource.title));
    setShowPdfModal(false);
  };

  const setResourceForMapping = (key: string) => {
    setResourceFile(key);
    if (!resourceTitle.trim()) {
      setResourceTitle(key.replace(/\.pdf$/i, '').replace(/_/g, ' '));
    }
    if (!resourceSlug.trim()) {
      setResourceSlug(
        key
          .replace(/\.pdf$/i, '')
          .replace(/_/g, ' ')
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, ''),
      );
    }
  };

  const saveResourceMapping = async () => {
    try {
      setResourceLoading(true);
      setResourceError(null);
      setResourceUrl('');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (password) headers['x-admin-password'] = password;
      const res = await fetch('/uploader/api/resources', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          slug: resourceSlug.trim(),
          title: resourceTitle.trim(),
          file: resourceFile.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save resource');
      }
      await loadResources();
      if (data?.row?.title && data?.row?.file) {
        setLessonFile(data.row.file);
        setLessonTitle(data.row.title);
        setSubject(defaultSubjectFor(data.row.title));
        setMessage(defaultMessageFor(data.row.title));
      }
      const slug = data?.row?.slug || resourceSlug.trim();
      if (slug) {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        setResourceUrl(`${origin}/uploader/api/manychat?resource=${encodeURIComponent(slug)}`);
      }
    } catch (err: any) {
      setResourceError(err.message || String(err));
    } finally {
      setResourceLoading(false);
    }
  };

  return (
    <div className="emails-page">
      {!authed ? (
        <div className="emails-login ui-card">
          <h3>Acceso administrador</h3>
          <p className="ui-muted">Ingresa tu contraseña para acceder.</p>
          <label className="emails-label">
            Contraseña:
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="ui-input emails-input"
            />
          </label>
          {authError && <p className="emails-error">Error: {authError}</p>}
          <button onClick={login} disabled={!password} className="ui-button ui-button-primary">
            Entrar
          </button>
        </div>
      ) : (
        <div className="emails-toolbar">
          <div className="emails-toolbar__left">
            <button onClick={fetchEmails} disabled={loading} className="ui-button ui-button-primary">
              {loading ? 'Cargando…' : 'Cargar emails'}
            </button>
            <button onClick={logout} className="ui-button ui-button-outline">
              Salir
            </button>
          </div>
        </div>
      )}

      {authed && (
        <div className="emails-shell">
        <aside className="emails-side">
          <button
            type="button"
            className={`emails-tab${activeTab === 'emails' ? ' is-active' : ''}`}
            onClick={() => setActiveTab('emails')}
          >
            Emails
          </button>
          <button
            type="button"
            className={`emails-tab${activeTab === 'manychat' ? ' is-active' : ''}`}
            onClick={() => setActiveTab('manychat')}
          >
            ManyChat
          </button>
        </aside>

        <div className="emails-main">
          {activeTab === 'emails' && (
            <>
              <div className="emails-card ui-card">
                <div className="emails-card__title">Contenido del email</div>
                <div className="emails-row">
                  <label className="emails-label">
                    Nombre del PDF (debe terminar en .pdf):
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
                        disabled={!authed}
                        className="ui-button ui-button-outline"
                      >
                        Buscar PDFs
                      </button>
                    </div>
                  </label>
                  <label className="emails-label">
                    Título:
                    <input
                      type="text"
                      value={lessonTitle}
                      onChange={e => setLessonTitle(e.target.value)}
                      placeholder="Tu lección de inglés"
                      className="ui-input"
                    />
                  </label>
                </div>
                <label className="emails-label emails-label--full">
                  Asunto:
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="ui-input"
                  />
                </label>
                <label className="emails-label emails-label--full">
                  Mensaje extra (opcional):
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
                  <div className="emails-table__toolbar">
                    <div className="emails-table__count">
                      {sortedRows.length} registros
                    </div>
                    <input
                      type="text"
                      value={tableSearch}
                      onChange={e => setTableSearch(e.target.value)}
                      placeholder="Buscar por nombre, email o fuente..."
                      className="ui-input emails-table__search"
                    />
                  </div>
                  <div className="emails-table__scroller">
                    <table className="emails-table__table">
                    <thead>
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            checked={selectedRecipients.length === sortedRows.length && sortedRows.length > 0}
                            onChange={e => toggleAll(e.target.checked)}
                          />
                        </th>
                        <th>
                          <button
                            type="button"
                            className="emails-table__sort"
                            onClick={() => toggleSort('name')}
                          >
                            Name
                            <span>{sortKey === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</span>
                          </button>
                        </th>
                        <th>
                          <button
                            type="button"
                            className="emails-table__sort"
                            onClick={() => toggleSort('email')}
                          >
                            Email
                            <span>{sortKey === 'email' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</span>
                          </button>
                        </th>
                        <th>
                          <button
                            type="button"
                            className="emails-table__sort"
                            onClick={() => toggleSort('source')}
                          >
                            Source
                            <span>{sortKey === 'source' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</span>
                          </button>
                        </th>
                        <th>
                          <button
                            type="button"
                            className="emails-table__sort"
                            onClick={() => toggleSort('created_at')}
                          >
                            Registered
                            <span>{sortKey === 'created_at' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</span>
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRows.map((row, idx) => (
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
                </div>
              )}

              {rows.length > 0 && (
                <div className="emails-actions">
                  <button
                    onClick={sendEmails}
                    disabled={
                      sending ||
                      selectedRecipients.length === 0 ||
                      !lessonFile.trim()
                    }
                    className="ui-button ui-button-primary"
                  >
                    {sending ? 'Enviando…' : `Enviar a seleccionados (${selectedRecipients.length})`}
                  </button>
                </div>
              )}

              {rows.length === 0 && !loading && !error && (
                <p className="emails-empty">Aún no hay emails cargados.</p>
              )}
            </>
          )}

          {activeTab === 'manychat' && (
            <div className="emails-card ui-card">
              <div className="emails-card__title">Recursos de ManyChat</div>
              <div className="emails-mode-card">
                <div>
                  <div className="emails-mode-card__title">Modo de envío ManyChat</div>
                  <div className="emails-mode-card__meta">
                    {manychatTestMode
                      ? 'TEST: envía al correo de prueba'
                      : 'PRODUCCIÓN: envía al usuario final'}
                  </div>
                </div>
                <button
                  type="button"
                  className={`emails-mode-toggle ${manychatTestMode ? 'is-on' : ''}`}
                  onClick={() => setManychatMode(!manychatTestMode)}
                  disabled={manychatModeLoading}
                  aria-pressed={manychatTestMode}
                >
                  <span className="emails-mode-toggle__state">
                    {manychatModeLoading ? 'Guardando...' : manychatTestMode ? 'TEST' : 'PROD'}
                  </span>
                  <span className="emails-mode-toggle__track" aria-hidden="true">
                    <span className="emails-mode-toggle__thumb" />
                  </span>
                </button>
              </div>
              <div className="emails-mode-divider" />
              <div className="emails-row">
                <button
                  type="button"
                  onClick={openPdfModal}
                  disabled={!authed}
                  className="ui-button ui-button-outline"
                >
                  Buscar PDFs
                </button>
              </div>

              {resourceLoading && <div className="emails-muted">Cargando recursos…</div>}
              {resourceError && <div className="emails-error">Error: {resourceError}</div>}
              {!resourceLoading && !resourceError && (
                <div className="emails-modal__list">
                  {resourceRows.map(item => (
                    <button
                      key={item.slug}
                      type="button"
                      onClick={() => selectResource(item)}
                      className="emails-modal__item"
                    >
                      <div className="emails-modal__item-title">
                        {item.title} ({item.slug})
                      </div>
                      <div className="emails-modal__item-meta">{item.file}</div>
                    </button>
                  ))}
                  {resourceRows.length === 0 && (
                    <div className="emails-muted">Aún no hay recursos guardados.</div>
                  )}
                </div>
              )}

              <div className="emails-modal__section">
                <div className="emails-modal__section-title">Crear / Actualizar recurso</div>
                <label className="emails-label emails-label--full">
                  Nombre del PDF
                  <input
                    type="text"
                    value={resourceFile}
                    onChange={e => setResourceFile(e.target.value)}
                    placeholder="Selecciona un PDF arriba"
                    className="ui-input"
                  />
                </label>
                <label className="emails-label emails-label--full">
                  Slug del recurso
                  <input
                    type="text"
                    value={resourceSlug}
                    onChange={e => setResourceSlug(e.target.value)}
                    placeholder="ejemplo: 10-formas-like-it"
                    className="ui-input"
                  />
                </label>
                <label className="emails-label emails-label--full">
                  Título del recurso
                  <input
                    type="text"
                    value={resourceTitle}
                    onChange={e => setResourceTitle(e.target.value)}
                    placeholder="ejemplo: 10 formas de decir I like it"
                    className="ui-input"
                  />
                </label>
                <button
                  type="button"
                  onClick={saveResourceMapping}
                  disabled={
                    !resourceSlug.trim() ||
                    !resourceTitle.trim() ||
                    !resourceFile.trim()
                  }
                  className="ui-button ui-button-primary"
                >
                  Guardar recurso
                </button>
                {resourceUrl && (
                  <div className="emails-resource-url">
                    <div className="emails-resource-url__label">URL para ManyChat</div>
                    <div className="emails-resource-url__row">
                      <code className="emails-resource-url__value">{resourceUrl}</code>
                      <button
                        type="button"
                        className="ui-button ui-button-outline"
                        onClick={() => navigator.clipboard.writeText(resourceUrl)}
                      >
                        Copiar URL
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {authed && showPdfModal && (
        <div className="emails-modal">
          <div className="emails-modal__content">
            <div className="emails-modal__header">
              <div>
                <div className="emails-modal__title">Selecciona un PDF</div>
                <div className="emails-modal__subtitle">Elige un archivo o un recurso guardado.</div>
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
                  placeholder="Buscar PDFs..."
                  className="ui-input"
                />
              </div>

            {pdfLoading && <div className="emails-muted">Cargando PDFs…</div>}
            {pdfError && <div className="emails-error">Error: {pdfError}</div>}

            {!pdfLoading && !pdfError && (
              <div className="emails-modal__list">
                {filteredPdfs.map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      if (activeTab === 'emails') {
                        selectPdf(item.key);
                      } else {
                        setResourceForMapping(item.key);
                      }
                    }}
                    className="emails-modal__item"
                  >
                    <div className="emails-modal__item-title">{item.key}</div>
                    {item.lastModified && (
                      <div className="emails-modal__item-meta">
                        Actualizado {new Date(item.lastModified).toLocaleString()}
                        {typeof item.size === 'number'
                          ? ` • ${(item.size / 1024).toFixed(1)} KB`
                          : ''}
                      </div>
                    )}
                  </button>
                ))}
                {filteredPdfs.length === 0 && (
                  <div className="emails-muted">No se encontraron PDFs.</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
