'use client';

import { useEffect, useRef, useState } from 'react';
import AdminShell from '../admin/AdminShell';

type LocalFile = {
  file: File;
  customName: string;   // final filename on S3 (with underscores)
  lessonTitle: string;  // human title for ?title=
};

type UploadedFile = {
  originalName: string;
  finalName: string;
  url: string;
  lessonTitle?: string;
  socialUrl?: string;
};

const SOCIAL_BASE_URL = 'https://aprenderinglesfull.com/lesson.php';

export default function UploaderPage() {
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const hydrateAuth = async () => {
      try {
        const res = await fetch('/uploader/api/upload/session');
        const data = await res.json();
        if (res.ok && data?.ok) {
          setAuthed(true);
        }
      } catch {
        setAuthed(false);
      }
    };
    hydrateAuth();
  }, []);

  const login = async () => {
    try {
      setAuthError(null);
      const res = await fetch('/uploader/api/upload/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }
      setAuthed(true);
    } catch (err: any) {
      setAuthed(false);
      setAuthError(err.message || String(err));
    }
  };

  const logout = async () => {
    await fetch('/uploader/api/upload/session', { method: 'DELETE' });
    setAuthed(false);
    setPassword('');
    setFiles([]);
    setUploaded([]);
    setError(null);
  };

  const handleFiles = (selected: FileList | File[]) => {
    if (!selected || selected.length === 0) return;

    const arr: LocalFile[] = [];
    for (let i = 0; i < selected.length; i++) {
      const f = selected[i] as File;
      if (!f || f.type !== 'application/pdf') continue;

      // default filename: spaces -> underscores
      const defaultName = f.name.replace(/\s+/g, '_');

      // default lesson title: remove extension, underscores -> spaces
      const baseNoExt = defaultName.replace(/\.[^.]+$/, '');
      const defaultTitle = baseNoExt.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

      arr.push({
        file: f,
        customName: defaultName,
        lessonTitle: defaultTitle,
      });
    }
    setFiles(arr);
    setUploaded([]);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    handleFiles(selected);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (!e.dataTransfer?.files?.length) return;
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleNameChange = (index: number, newName: string) => {
    // force underscores for spaces
    const safe = newName.replace(/\s+/g, '_');
    setFiles(prev =>
      prev.map((item, i) => (i === index ? { ...item, customName: safe } : item)),
    );
  };

  const handleTitleChange = (index: number, newTitle: string) => {
    setFiles(prev =>
      prev.map((item, i) => (i === index ? { ...item, lessonTitle: newTitle } : item)),
    );
  };

  const handleUpload = async () => {
    try {
      setLoading(true);
      setError(null);
      setUploaded([]);

      const formData = new FormData();
      files.forEach(item => {
        // create a new File with our custom name
        const renamedFile = new File([item.file], item.customName, {
          type: item.file.type || 'application/pdf',
        });
        formData.append('files', renamedFile);
      });

      // IMPORTANT: no leading slash so it respects basePath (/uploader)
      const res = await fetch('api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      const uploadedFromApi: UploadedFile[] = data.uploaded || [];

      // Attach lessonTitle + socialUrl for each uploaded file
      const enriched: UploadedFile[] = uploadedFromApi.map((u, idx) => {
        const lessonTitle = files[idx]?.lessonTitle || u.finalName;
        const socialUrl =
          `${SOCIAL_BASE_URL}?file=${encodeURIComponent(u.finalName)}` +
          `&title=${encodeURIComponent(lessonTitle)}`;

        return {
          ...u,
          lessonTitle,
          socialUrl,
        };
      });

      setUploaded(enriched);
    } catch (err: any) {
      console.error(err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminShell hideHero hidePanelHeader>
      <section className="admin-panel uploader-panel">
        {!authed ? (
          <div className="emails-login uploader-login">
            <div className="emails-login__card">
              <h2>Ingresa tu contraseña para acceder.</h2>
              <label className="emails-login__label">
                Contraseña:
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="ui-input"
                />
              </label>
              {authError && <p className="emails-login__error">{authError}</p>}
              <button className="ui-button ui-button-primary" onClick={login}>
                Entrar
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="emails-toolbar uploader-toolbar">
              <div className="emails-toolbar__left">
                <button className="ui-button ui-button-outline" onClick={logout}>
                  Logout
                </button>
              </div>
            </div>

            <div className="uploader-toolbar">
              <div
                className={`uploader-dropzone ${dragOver ? 'is-dragover' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
                }}
              >
                <div className="uploader-dropzone__title">Arrastra tus PDFs aqui</div>
                <div className="uploader-dropzone__hint">
                  o haz click para seleccionar archivos
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="uploader-file uploader-file--hidden"
                />
              </div>
            </div>
          </>
        )}

        {authed && files.length > 0 && (
          <section className="uploader-section">
            <h3>Rename files & set lesson titles:</h3>
            {files.map((item, idx) => (
              <div key={idx} className="uploader-card ui-card">
                <div className="uploader-meta">
                  Original: <strong>{item.file.name}</strong>
                </div>

                <label className="uploader-label">
                  Final filename (S3, underscores only):
                  <input
                    type="text"
                    value={item.customName}
                    onChange={e => handleNameChange(idx, e.target.value)}
                    className="ui-input"
                  />
                </label>

                <label className="uploader-label">
                  Lesson title (for <code>?title=</code> in the link):
                  <input
                    type="text"
                    value={item.lessonTitle}
                    onChange={e => handleTitleChange(idx, e.target.value)}
                    className="ui-input"
                  />
                </label>
              </div>
            ))}

            <button
              onClick={handleUpload}
              disabled={loading || files.length === 0}
              className="ui-button ui-button-primary"
            >
              {loading ? 'Uploading…' : 'Upload to S3'}
            </button>
          </section>
        )}

        {authed && error && <p className="uploader-error">Error: {error}</p>}

        {authed && uploaded.length > 0 && (
          <section className="uploader-section">
            <h3>Uploaded files</h3>
            <ul className="uploader-list">
              {uploaded.map((u, idx) => (
                <li key={idx} className="uploader-list__item">
                  <div className="uploader-title">
                    <strong>{u.finalName}</strong>
                    {u.lessonTitle && (
                      <>
                        {' '}
                        — <em>{u.lessonTitle}</em>
                      </>
                    )}
                  </div>

                  <div className="uploader-block">
                    <div className="uploader-label-text">PDF URL (CloudFront):</div>
                    <code className="uploader-code">{u.url}</code>
                    <div className="uploader-actions">
                      <a
                        href={u.url}
                        target="_blank"
                        rel="noreferrer"
                        className="uploader-link"
                      >
                        Open PDF
                      </a>
                      <button
                        type="button"
                        onClick={() => setPreviewUrl(u.url)}
                        className="ui-button ui-button-outline uploader-preview"
                      >
                        Preview here
                      </button>
                    </div>
                  </div>

                  {u.socialUrl && (
                    <div className="uploader-block">
                      <div className="uploader-label-text">Landing page URL for social:</div>
                      <code className="uploader-code uploader-code--alt">{u.socialUrl}</code>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </section>

      {previewUrl && (
        <div className="uploader-modal">
          <div className="uploader-modal__content">
            <div className="uploader-modal__header">
              <div className="uploader-modal__url">{previewUrl}</div>
              <button
                type="button"
                onClick={() => setPreviewUrl(null)}
                className="uploader-modal__close"
                aria-label="Close preview"
              >
                ✕
              </button>
            </div>
            <iframe src={previewUrl} className="uploader-modal__frame" />
          </div>
        </div>
      )}
    </AdminShell>
  );
}
