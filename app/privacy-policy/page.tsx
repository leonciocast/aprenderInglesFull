export const metadata = {
  title: 'Política de Privacidad | AprenderInglesFull',
  description: 'Política de privacidad de la app AprenderInglesFull.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="ui-shell ui-shell--light">
      <section className="support-wrap">
        <article className="ui-card support-card">
          <span className="ui-tag">Legal</span>
          <h1>Política de Privacidad</h1>
          <p className="ui-muted">Última actualización: 24 de febrero de 2026</p>

          <h2>1. Información que recopilamos</h2>
          <p>
            Podemos recopilar datos como nombre, correo electrónico y actividad de uso dentro de la
            app para proporcionar acceso a contenido educativo y mejorar el servicio.
          </p>

          <h2>2. Uso de la información</h2>
          <p>Usamos la información para:</p>
          <ul className="support-list">
            <li>Crear y administrar tu cuenta.</li>
            <li>Enviar recursos educativos solicitados.</li>
            <li>Brindar soporte técnico.</li>
            <li>Mejorar la experiencia y el contenido.</li>
          </ul>

          <h2>3. Compartición de datos</h2>
          <p>
            No vendemos tu información personal. Solo compartimos datos con proveedores
            tecnológicos necesarios para operar la plataforma (por ejemplo, correo y hosting).
          </p>

          <h2>4. Seguridad</h2>
          <p>
            Aplicamos medidas razonables de seguridad para proteger tus datos, aunque ningún
            sistema es 100% infalible.
          </p>

          <h2>5. Retención y derechos</h2>
          <p>
            Conservamos tus datos mientras exista una relación de servicio o por obligaciones
            legales. Puedes solicitar acceso, actualización o eliminación de tus datos.
          </p>

          <h2>6. Menores de edad</h2>
          <p>
            Si eres menor de edad, debes usar la app bajo supervisión de tus padres o tutores.
          </p>

          <h2>7. Contacto</h2>
          <p>
            Para preguntas sobre privacidad, escríbenos a{' '}
            <a href="mailto:info@aprenderinglesfull.com">info@aprenderinglesfull.com</a>.
          </p>
        </article>
      </section>
    </main>
  );
}
