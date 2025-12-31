'use client';

import { useState } from 'react';

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
  const [uploaded, setUploaded] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;

    const arr: LocalFile[] = [];
    for (let i = 0; i < selected.length; i++) {
      const f = selected[i];

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
        headers: {
          'x-admin-password': password,
        },
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
    <main
      style={{
        padding: 24,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        maxWidth: 900,
        margin: '0 auto',
        minHeight: '100vh',
        backgroundColor: '#020617', // dark background
        color: '#e5e7eb',
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Lesson PDF Uploader</h1>
      <p style={{ marginBottom: 16, maxWidth: 640 }}>
        Upload lesson PDFs to S3 / CloudFront and get shareable links for your social media
        videos.
      </p>

      <div style={{ marginBottom: 16 }}>
        <label>
          Admin password:{' '}
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{
              padding: 6,
              minWidth: 220,
              borderRadius: 6,
              border: '1px solid #4b5563',
              backgroundColor: '#020617',
              color: '#e5e7eb',
            }}
          />
        </label>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          type="file"
          multiple
          accept="application/pdf"
          onChange={handleFileChange}
          style={{ color: '#e5e7eb' }}
        />
      </div>

      {files.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 8 }}>Rename files & set lesson titles:</h3>
          {files.map((item, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: 12,
                padding: 10,
                border: '1px solid #374151',
                borderRadius: 8,
                backgroundColor: '#020617',
              }}
            >
              <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 4 }}>
                Original: <strong>{item.file.name}</strong>
              </div>

              <label style={{ fontSize: 14, display: 'block', marginBottom: 4 }}>
                Final filename (S3, underscores only):
                <br />
                <input
                  type="text"
                  value={item.customName}
                  onChange={e => handleNameChange(idx, e.target.value)}
                  style={{
                    padding: 6,
                    minWidth: 320,
                    marginTop: 4,
                    borderRadius: 6,
                    border: '1px solid #4b5563',
                    backgroundColor: '#020617',
                    color: '#e5e7eb',
                  }}
                />
              </label>

              <label style={{ fontSize: 14, display: 'block', marginTop: 8 }}>
                Lesson title (for <code>?title=</code> in the link):
                <br />
                <input
                  type="text"
                  value={item.lessonTitle}
                  onChange={e => handleTitleChange(idx, e.target.value)}
                  style={{
                    padding: 6,
                    minWidth: 320,
                    marginTop: 4,
                    borderRadius: 6,
                    border: '1px solid #4b5563',
                    backgroundColor: '#020617',
                    color: '#e5e7eb',
                  }}
                />
              </label>
            </div>
          ))}

          <button
            onClick={handleUpload}
            disabled={loading || !password || files.length === 0}
            style={{
              marginTop: 8,
              padding: '10px 20px',
              borderRadius: 9999,
              border: 'none',
              backgroundColor: '#2563eb',
              color: 'white',
              fontWeight: 600,
              cursor: loading || !password || files.length === 0 ? 'not-allowed' : 'pointer',
              opacity: loading || !password || files.length === 0 ? 0.6 : 1,
            }}
          >
            {loading ? 'Uploading…' : 'Upload to S3'}
          </button>
        </section>
      )}

      {error && (
        <p style={{ color: '#f87171', marginTop: 8 }}>
          Error: {error}
        </p>
      )}

      {uploaded.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <h3 style={{ color: '#ffffff', marginBottom: 8 }}>Uploaded files</h3>
          <ul style={{ paddingLeft: 18 }}>
            {uploaded.map((u, idx) => (
              <li key={idx} style={{ marginBottom: 20 }}>
                <div style={{ color: '#ffffff', fontSize: 16 }}>
                  <strong>{u.finalName}</strong>
                  {u.lessonTitle && (
                    <>
                      {' '}
                      — <em>{u.lessonTitle}</em>
                    </>
                  )}
                </div>

                {/* CloudFront URL (direct PDF) */}
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontSize: 13, color: '#9ca3af' }}>PDF URL (CloudFront):</div>
                  <code
                    style={{
                      display: 'block',
                      background: '#1f2937',
                      padding: '8px 10px',
                      borderRadius: 6,
                      color: '#ffffff',
                      wordBreak: 'break-all',
                      border: '1px solid #374151',
                      fontSize: 14,
                      marginTop: 4,
                    }}
                  >
                    {u.url}
                  </code>
                  <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <a
                      href={u.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: '#93c5fd',
                        textDecoration: 'none',
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      Open PDF
                    </a>
                    <button
                      type="button"
                      onClick={() => setPreviewUrl(u.url)}
                      style={{
                        border: '1px solid #2563eb',
                        backgroundColor: '#0b1220',
                        color: '#93c5fd',
                        padding: '4px 10px',
                        borderRadius: 9999,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Preview here
                    </button>
                  </div>
                </div>

                {/* Social / landing page URL */}
                {u.socialUrl && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 13, color: '#9ca3af' }}>
                      Landing page URL for social:
                    </div>
                    <code
                      style={{
                        display: 'block',
                        background: '#312e81',
                        padding: '8px 10px',
                        borderRadius: 6,
                        color: '#f9fafb',
                        wordBreak: 'break-all',
                        border: '1px solid #4338ca',
                        fontSize: 14,
                        marginTop: 4,
                      }}
                    >
                      {u.socialUrl}
                    </code>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {previewUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(2, 6, 23, 0.85)',
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
              maxWidth: 960,
              backgroundColor: '#0b1220',
              borderRadius: 12,
              border: '1px solid #1f2937',
              padding: 12,
              color: '#e5e7eb',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>{previewUrl}</div>
              <button
                type="button"
                onClick={() => setPreviewUrl(null)}
                style={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#9ca3af',
                  fontSize: 18,
                  cursor: 'pointer',
                }}
                aria-label="Close preview"
              >
                ✕
              </button>
            </div>
            <iframe
              src={previewUrl}
              style={{
                width: '100%',
                height: '70vh',
                border: '1px solid #1f2937',
                borderRadius: 10,
                backgroundColor: '#0f172a',
              }}
            />
          </div>
        </div>
      )}
    </main>
  );
}
