'use client';

import React from 'react';

const AUDIO_BASE_URL = 'https://cdn.aprenderinglesfull.com/10-likes';

const AUDIO_FILES = [
  "10 likes_I've grown to like it.mp3",
  "10 likes_It's right up my alley.mp3",
  "10 likes_I'm hooked!.mp3",
  "10 likes_I'm crazy about.mp3",
  "10 likes_It's my thing.mp3",
  "10 likes_I'm quite fond of it.mp3",
  "10 likes_I absolutely adore it.mp3",
  "10 likes_I'm into it.mp3",
  "10 likes_I'm a big fan of.mp3",
  "10 likes_It appeals to me.mp3",
];

function toTitle(filename: string) {
  return filename.replace(/^10 likes_/, '').replace(/\.mp3$/i, '').trim();
}

function audioUrl(filename: string) {
  return `${AUDIO_BASE_URL}/${encodeURIComponent(filename)}`;
}

const INSTAGRAM_COMMUNITY_URL = 'https://www.instagram.com/channel/AbbHN4iC8_wasTe2/';
const INSTAGRAM_QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
  INSTAGRAM_COMMUNITY_URL,
)}`;

export default function Bono10LikesPage() {
  return (
    <main className="auth-page ui-shell ui-shell--light">
      <div className="auth-card ui-card audio-bono-card">
        <span className="auth-pill">Bono</span>
        <h1>10 Likes</h1>
        <p className="auth-subtitle">
          Escucha cada frase y practica la pronunciación.
        </p>

        <div className="audio-layout">
          <div className="audio-list">
            {AUDIO_FILES.map((file, idx) => {
              const title = toTitle(file);
              const url = audioUrl(file);
              return (
                <div key={file} className="audio-row">
                  <div className="audio-left">
                    <div className="audio-index">{String(idx + 1).padStart(2, '0')}</div>
                    <div className="audio-title">{title}</div>
                  </div>
                  <div className="audio-right">
                    <audio controls preload="none" src={url} />
                  </div>
                </div>
              );
            })}
          </div>

          <aside className="audio-promo">
            <div className="promo-card">
              <div className="promo-header">
                <div className="promo-badge">Comunidad VIP</div>
                <h2>Inglés Full: VIP Tips</h2>
                <p>Tips diarios, práctica guiada y recursos exclusivos.</p>
              </div>

              <div className="promo-qr">
                <img
                  src={INSTAGRAM_QR_URL}
                  alt="QR comunidad Instagram"
                  width={220}
                  height={220}
                />
              </div>

              <p className="promo-copy">
                ¿Te gustó el contenido? Únete a nuestra comunidad en Instagram.
                Escanea el código QR o haz clic en “Unirme ahora”.
              </p>

              <div className="promo-actions">
                <a
                  className="ui-button ui-button-primary promo-cta"
                  href={INSTAGRAM_COMMUNITY_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  Unirme ahora
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <style jsx>{`
        .audio-bono-card {
          max-width: 980px;
          width: 100%;
        }
        .audio-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 20px;
          align-items: start;
          margin-top: 20px;
        }
        .audio-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .audio-row {
          display: flex;
          gap: 18px;
          align-items: center;
          padding: 16px;
          border-radius: 14px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }
        .audio-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 280px;
        }
        .audio-index {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #1d4ed8;
          color: #fff;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          letter-spacing: 0.5px;
        }
        .audio-title {
          font-size: 16px;
          font-weight: 600;
          color: #0f172a;
        }
        .audio-right {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-left: auto;
        }
        .audio-right audio {
          width: 320px;
        }
        .audio-promo {
          position: sticky;
          top: 24px;
        }
        .promo-card {
          background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
          border: 1px solid #dbeafe;
          border-radius: 20px;
          padding: 18px;
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
          display: flex;
          flex-direction: column;
          gap: 12px;
          text-align: center;
          font-family: 'Manrope', 'Segoe UI', system-ui, sans-serif;
        }
        .promo-header {
          background: linear-gradient(135deg, #1d4ed8, #0ea5e9);
          color: #fff;
          padding: 16px;
          border-radius: 16px;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.2);
        }
        .promo-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          background: rgba(255,255,255,0.2);
          margin-bottom: 8px;
        }
        .promo-header h2 {
          margin: 0 0 6px 0;
          font-size: 20px;
          font-weight: 700;
        }
        .promo-header p {
          margin: 0;
          font-size: 13px;
          opacity: 0.9;
        }
        .promo-qr {
          background: #ffffff;
          border-radius: 16px;
          padding: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 8px 16px rgba(15, 23, 42, 0.08);
          display: flex;
          justify-content: center;
        }
        .promo-copy {
          margin: 0;
          font-size: 14px;
          color: #1f2937;
          line-height: 1.5;
        }
        .promo-actions {
          display: grid;
          gap: 8px;
        }
        .promo-cta {
          width: 100%;
          color: #fff !important;
        }
        @media (max-width: 860px) {
          .audio-layout {
            grid-template-columns: 1fr;
          }
          .audio-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .audio-left {
            min-width: auto;
          }
          .audio-right {
            width: 100%;
            flex-direction: column;
            align-items: flex-start;
          }
          .audio-right audio {
            width: 100%;
          }
          .audio-promo {
            position: static;
          }
        }
      `}</style>
    </main>
  );
}
