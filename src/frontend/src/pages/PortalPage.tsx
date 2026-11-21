import React, { useState } from "react";
import { Link } from "react-router-dom";
import BrandMark from "../components/BrandMark";
import Icon from "../components/Icon";
import { getSessionUser } from "../lib/session";
import { useUi } from "../components/UiProvider";
import { IconButton } from "../components/Ui";
import AccessHelp from "../components/AccessHelp";
export default function PortalPage() {
  const user = getSessionUser(),
    { preferences, setPreferences } = useUi(),
    [help, setHelp] = useState(false);
  const destination = user
    ? user.mustChangePassword
      ? "/cambiar-contrasena"
      : user.rol === "Colaborador"
        ? "/equipos"
        : "/panel"
    : "/login";
  return (
    <div className="public-page premium-public">
      <a className="skip-link" href="#public-main">
        Saltar al contenido
      </a>
      <div className="premium-cover">
        <header className="premium-header">
          <Link to="/" className="brand">
            <span className="brand-symbol">
              <BrandMark size={27} />
            </span>
            <span>
              TechAsset<small>INNOVATECH SOLUTIONS</small>
            </span>
          </Link>
          <nav aria-label="Navegación pública">
            <a href="#capacidades">La plataforma</a>
            <a href="#proceso">Flujo de trabajo</a>
            <a href="#acceso">Roles y acceso</a>
          </nav>
          <div className="premium-header-actions">
            <IconButton
              label={
                preferences.theme === "dark"
                  ? "Activar modo claro"
                  : "Activar modo oscuro"
              }
              icon={preferences.theme === "dark" ? "sun" : "moon"}
              onClick={() =>
                setPreferences({
                  ...preferences,
                  theme: preferences.theme === "dark" ? "light" : "dark",
                })
              }
            />
            <Link to={destination} className="btn btn-primary">
              {user ? "Mi espacio" : "Iniciar sesión"}
              <Icon name="arrow" size={17} />
            </Link>
          </div>
        </header>
        <main id="public-main">
          <section className="premium-hero">
            <div className="premium-hero-copy">
              <div className="premium-kicker">
                <span /> GESTIÓN INSTITUCIONAL DE ACTIVOS
              </div>
              <h1>
                La tecnología
                <br />
                se mueve.
                <br />
                <em>Tú tienes el control.</em>
              </h1>
              <p>
                Conecta cada equipo con la persona que lo necesita. Gestiona
                inventario, préstamos y devoluciones desde un solo lugar.
              </p>
              <div className="premium-hero-actions">
                <Link className="btn btn-primary" to={destination}>
                  {user ? "Volver a mi espacio" : "Acceder a TechAsset"}
                  <Icon name="arrow" size={18} />
                </Link>
                <a className="premium-secondary-link" href="#capacidades">
                  Explorar la plataforma <Icon name="chevron" size={16} />
                </a>
              </div>
              <div className="premium-security">
                <Icon name="shield" size={18} />
                <span>
                  Acceso personal. Permisos por rol. Operaciones trazables.
                </span>
              </div>
            </div>
            <div className="hero-asset-label" aria-hidden="true">
              ACTIVOS TECNOLÓGICOS
              <small>Un inventario. Un ciclo de vida conectado.</small>
            </div>
          </section>
          <div
            className="premium-process-ribbon"
            aria-label="Ciclo de los activos"
          >
            {[
              {
                n: "01",
                icon: "search",
                title: "Encuentra",
                text: "Consulta el inventario disponible.",
              },
              {
                n: "02",
                icon: "loans",
                title: "Asigna",
                text: "Registra la entrega y su responsable.",
              },
              {
                n: "03",
                icon: "history",
                title: "Recupera",
                text: "Devuelve y conserva el historial.",
              },
            ].map((x) => (
              <a href="#proceso" key={x.n}>
                <span className="ribbon-number">{x.n}</span>
                <div>
                  <strong>{x.title}</strong>
                  <p>{x.text}</p>
                </div>
                <Icon name={x.icon} size={25} />
              </a>
            ))}
          </div>
        </main>
      </div>
      <section id="capacidades" className="premium-section">
        <div className="premium-section-heading">
          <div>
            <div className="eyebrow">La plataforma</div>
            <h2>
              Menos registros dispersos.
              <br />
              <em>Más claridad en cada operación.</em>
            </h2>
          </div>
          <p>
            Diseñado para el trabajo diario de colaboradores, responsables de
            Tecnología y administradores de Innovatech.
          </p>
        </div>
        <div className="capability-grid">
          {[
            {
              icon: "equipment",
              number: "01",
              title: "El inventario es el punto de partida.",
              text: "Identifica cada activo por su código patrimonial, categoría, marca y estado. Encuentra el equipo que necesitas con búsquedas y filtros.",
              wide: true,
            },
            {
              icon: "loans",
              number: "02",
              title: "Cada entrega tiene un responsable.",
              text: "Asigna equipos disponibles y conserva las condiciones de entrega. Un equipo no puede tener dos préstamos activos.",
              wide: false,
            },
            {
              icon: "history",
              number: "03",
              title: "La devolución completa la historia.",
              text: "Registra la recepción, actualiza el estado y conserva las observaciones de entrega y devolución.",
              wide: false,
            },
            {
              icon: "dashboard",
              number: "04",
              title: "Decisiones con datos registrados.",
              text: "Consulta disponibilidad, préstamos por área y equipos más utilizados. Los indicadores se calculan desde la base de datos.",
              wide: true,
            },
          ].map((c) => (
            <article
              className={`capability-card ${c.wide ? "capability-wide" : ""} ${c.number === "04" ? "capability-report" : ""}`}
              key={c.number}
            >
              <div className="capability-top">
                <span className="feature-icon">
                  <Icon name={c.icon} size={26} />
                </span>
                <span>{c.number}</span>
              </div>
              <h3>{c.title}</h3>
              <p>{c.text}</p>
              <span className="capability-line" aria-hidden="true" />
            </article>
          ))}
        </div>
      </section>
      <section id="proceso" className="premium-section premium-workflow">
        <div className="workflow-art">
          <img src={`${import.meta.env.BASE_URL}assets/techasset-hero.webp`} alt="" loading="lazy" />
          <div>
            <BrandMark size={30} />
            <span>
              El valor de un equipo está
              <br />
              <strong>en el trabajo que hace posible.</strong>
            </span>
          </div>
        </div>
        <div className="workflow-copy">
          <div className="eyebrow">Un proceso compartido</div>
          <h2>
            De la solicitud
            <br />a la siguiente entrega.
          </h2>
          <ol>
            {[
              {
                title: "Consulta y solicita",
                text: "El colaborador revisa la disponibilidad y explica para qué necesita el equipo.",
              },
              {
                title: "Verifica y aprueba",
                text: "Tecnología comprueba el estado y registra la asignación al responsable correspondiente.",
              },
              {
                title: "Recibe y registra",
                text: "La devolución conserva las observaciones de recepción y determina si el equipo vuelve a estar disponible o pasa a mantenimiento.",
              },
            ].map((s, i) => (
              <li key={s.title}>
                <span>{i + 1}</span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section id="acceso" className="premium-section">
        <div className="premium-section-heading">
          <div>
            <div className="eyebrow">Personas y permisos</div>
            <h2>
              Un sistema.
              <br />
              <em>Un espacio para cada función.</em>
            </h2>
          </div>
          <p>
            Cada cuenta accede a las tareas de su rol. Los permisos se
            comprueban también en el servidor.
          </p>
        </div>
        <div className="premium-roles">
          {[
            {
              n: "01",
              title: "Colaborador",
              icon: "users",
              items: [
                "Consulta equipos disponibles",
                "Envía solicitudes de préstamo",
                "Revisa su propio historial",
              ],
              target: "Tu inicio: inventario",
            },
            {
              n: "02",
              title: "Tecnología",
              icon: "tools",
              items: [
                "Gestiona equipos y estados",
                "Aprueba solicitudes y asigna",
                "Registra las devoluciones",
              ],
              target: "Tu inicio: panel de operaciones",
            },
            {
              n: "03",
              title: "Administrador",
              icon: "shield",
              items: [
                "Administra cuentas y roles",
                "Supervisa las operaciones",
                "Consulta indicadores y auditoría",
              ],
              target: "Tu inicio: panel de operaciones",
            },
          ].map((r) => (
            <article key={r.n}>
              <div className="role-card-top">
                <Icon name={r.icon} size={29} />
                <span>PERFIL {r.n}</span>
              </div>
              <h3>{r.title}</h3>
              <ul>
                {r.items.map((item) => (
                  <li key={item}>
                    <Icon name="check" size={15} />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="role-destination">
                <Icon name="arrow" size={16} />
                {r.target}
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="premium-section premium-faq">
        <div>
          <div className="eyebrow">Antes de ingresar</div>
          <h2>
            Acceso claro.
            <br />
            Sin dudas pendientes.
          </h2>
          <button className="text-button" onClick={() => setHelp(true)}>
            Contactar a un administrador <Icon name="arrow" size={17} />
          </button>
        </div>
        <div>
          {[
            {
              q: "¿Cómo obtengo una cuenta?",
              a: "El administrador registra tu correo, área y rol y te comunica una contraseña temporal por un canal privado. La ayuda de acceso muestra los administradores activos del sistema.",
            },
            {
              q: "¿Qué ocurre en mi primer ingreso?",
              a: "Debes reemplazar la contraseña temporal antes de entrar a los módulos. Tu contraseña personal necesita al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.",
            },
            {
              q: "¿Por qué no puedo solicitar cualquier equipo?",
              a: "Solo se pueden asignar equipos disponibles. Los activos prestados, en mantenimiento o dados de baja tienen restricciones para evitar asignaciones incorrectas.",
            },
          ].map((f) => (
            <details key={f.q}>
              <summary>
                {f.q}
                <Icon name="plus" size={18} />
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="premium-final-cta">
        <div>
          <div className="premium-kicker">
            TU PRÓXIMA ASIGNACIÓN EMPIEZA AQUÍ
          </div>
          <h2>
            Los equipos cambian de manos.
            <br />
            <em>La información permanece.</em>
          </h2>
          <Link className="btn btn-primary" to={destination}>
            Entrar a mi espacio
            <Icon name="arrow" size={18} />
          </Link>
        </div>
      </section>
      <footer className="premium-footer">
        <div>
          <BrandMark size={23} />
          <strong>TechAsset</strong>
          <span>Innovatech Solutions S.A.C.</span>
        </div>
        <p>Inventario y préstamo de equipos tecnológicos</p>
        <button className="text-button" onClick={() => setHelp(true)}>
          Ayuda de acceso
        </button>
      </footer>
      {help && <AccessHelp close={() => setHelp(false)} />}
    </div>
  );
}
