export const metadata = {
  title: 'Soporte | AprenderInglesFull',
  description: 'Soporte oficial para usuarios de la app de AprenderInglesFull.',
};

const SUPPORT_EMAIL = 'info@aprenderinglesfull.com';
const INSTAGRAM_URL = 'https://www.instagram.com/aprendeinglesfull/';

export default function SupportPage() {
  return (
    <main className="ui-shell ui-shell--light">
      <section className="support-wrap">
        <article className="ui-card support-hero">
          <span className="ui-tag">Soporte App Store</span>
          <h1>Centro de Soporte</h1>
          <p>
            Si tienes problemas con acceso, registro, contenido o funcionamiento de la app,
            nuestro equipo te ayuda.
          </p>
          <div className="support-hero__actions">
            <a className="ui-button ui-button-primary" href={`mailto:${SUPPORT_EMAIL}`}>
              Escribir a soporte
            </a>
            <a
              className="ui-button ui-button-outline"
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
            >
              Ir a Instagram
            </a>
          </div>
        </article>

        <div className="support-grid">
          <section className="ui-card support-card">
            <h2>Contacto</h2>
            <ul className="support-list">
              <li>
                <strong>Email:</strong>{' '}
                <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
              </li>
              <li>
                <strong>Instagram:</strong>{' '}
                <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
                  @aprendeinglesfull
                </a>
              </li>
              <li>
                <strong>Horario:</strong> Lunes a viernes, 9:00 AM - 6:00 PM (ET)
              </li>
            </ul>
          </section>

          <section className="ui-card support-card">
            <h2>Preguntas frecuentes</h2>
            <div className="support-faq">
              <div>
                <h3>No recibo el correo de verificación</h3>
                <p>
                  Revisa spam/promociones y confirma que escribiste bien tu correo en el
                  registro.
                </p>
              </div>
              <div>
                <h3>No puedo iniciar sesión</h3>
                <p>
                  Verifica tu contraseña, intenta restablecerla y confirma que tu cuenta esté
                  verificada.
                </p>
              </div>
              <div>
                <h3>No veo mi contenido</h3>
                <p>
                  Cierra sesión, vuelve a entrar y actualiza la app a la versión más reciente.
                </p>
              </div>
            </div>
          </section>
        </div>

        <section className="ui-card support-card">
          <h2>Cuando escribas a soporte, incluye:</h2>
          <ul className="support-list">
            <li>Correo de tu cuenta registrada</li>
            <li>Modelo de iPhone y versión de iOS</li>
            <li>Descripción breve del problema y captura de pantalla</li>
          </ul>
        </section>
      </section>
    </main>
  );
}
