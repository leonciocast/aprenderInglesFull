'use client';

import { useEffect, useState } from 'react';

const PDF_FILENAME = 'La Guía Maestra de Linking.pdf';
const cloudfrontBase = (process.env.CLOUDFRONT_BASE_URL || '').replace(/\/$/, '');
const cloudfrontUrl = cloudfrontBase
  ? `${cloudfrontBase}/${encodeURIComponent(PDF_FILENAME)}`
  : '';
const fallbackUrl = `/uploader/api/pdfs/download?file=${encodeURIComponent(PDF_FILENAME)}`;
const downloadUrl = cloudfrontUrl || fallbackUrl;

export default function BonoGuiaMaestraLinkingPage() {
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');

  useEffect(() => {
    window.location.assign(downloadUrl);
    setStatus('ready');
  }, []);

  return (
    <main className="auth-page ui-shell ui-shell--light">
      <div className="auth-card ui-card">
        <span className="auth-pill">Bono</span>
        <h1>La Guía Maestra de Linking</h1>
        <p className="auth-subtitle">
          {status === 'loading'
            ? 'Preparando la descarga…'
            : 'Si la descarga no inicia, haz clic abajo.'}
        </p>
        <a className="ui-button ui-button-primary" href={downloadUrl}>
          Descargar PDF
        </a>
      </div>
    </main>
  );
}
