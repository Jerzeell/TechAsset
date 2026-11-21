import { IS_DEMO, leaveDemo } from '../lib/demo';
import React, { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import api from "../services/api";
import { allowedNavigation } from "../lib/navigation";
import { getSessionUser, roleLabel } from "../lib/session";
import BrandMark from "./BrandMark";
import Icon from "./Icon";
import { Button, IconButton, Modal, Search } from "./Ui";
import { useUi } from "./UiProvider";
import AccessibilityDialog from "./AccessibilityDialog";
import HelpDialog from "./HelpDialog";
export default function Layout() {
  const user = getSessionUser()!,
    items = allowedNavigation(user),
    location = useLocation(),
    navigate = useNavigate();
  const { preferences, setPreferences, confirm } = useUi();
  const [mobile, setMobile] = useState(false),
    [settings, setSettings] = useState(false),
    [help, setHelp] = useState(false),
    [command, setCommand] = useState(false),
    [query, setQuery] = useState("");
  const [connected, setConnected] = useState<boolean | null>(null);
  const active = items.find((x) => x.path === location.pathname) || items[0];
  useEffect(() => {
    let mounted = true;
    const check = () =>
      api
        .get("/health")
        .then(() => {
          if (mounted) setConnected(true);
        })
        .catch(() => {
          if (mounted) setConnected(false);
        });
    check();
    const interval = setInterval(check, 30000);
    window.addEventListener("online", check);
    const offline = () => setConnected(false);
    window.addEventListener("offline", offline);
    return () => {
      mounted = false;
      clearInterval(interval);
      window.removeEventListener("online", check);
      window.removeEventListener("offline", offline);
    };
  }, []);
  useEffect(() => {
    setMobile(false);
    document.getElementById("main-content")?.scrollTo({ top: 0 });
  }, [location.pathname]);
  useEffect(() => {
    const keys = (e: KeyboardEvent) => {
      const modalOpen = !!document.querySelector("dialog[open]");
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (!modalOpen) {
          setQuery("");
          setCommand(true);
        }
      } else if (e.key === "F1") {
        e.preventDefault();
        if (!modalOpen) setHelp(true);
      } else if (
        e.key === "/" &&
        !modalOpen &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement).tagName,
        )
      ) {
        e.preventDefault();
        window.dispatchEvent(new Event("techasset:search"));
        requestAnimationFrame(() =>
          document
            .querySelector<HTMLInputElement>("[data-page-search]")
            ?.focus(),
        );
      }
    };
    window.addEventListener("keydown", keys);
    return () => window.removeEventListener("keydown", keys);
  }, []);
  useEffect(() => {
    if (!mobile) return;
    const aside = document.querySelector<HTMLElement>(".sidebar");
    const workspace = document.querySelector<HTMLElement>(".workspace");
    const previous = document.activeElement as HTMLElement;
    workspace?.setAttribute("inert", "");
    aside?.querySelector<HTMLElement>("a,button")?.focus();
    const keys = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setMobile(false);
      }
      if (e.key === "Tab" && aside) {
        const controls = Array.from(
          aside.querySelectorAll<HTMLElement>("a[href],button:not(:disabled)"),
        ).filter((x) => getComputedStyle(x).visibility !== "hidden");
        const first = controls[0],
          last = controls[controls.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", keys);
    return () => {
      workspace?.removeAttribute("inert");
      window.removeEventListener("keydown", keys);
      previous?.focus();
    };
  }, [mobile]);
  const logout = async () => {
    if (
      await confirm({
        title: "¿Cerrar la sesión?",
        description:
          "Volverás a la pantalla de acceso. Los cambios que ya guardaste permanecerán registrados.",
        label: "Cerrar sesión",
      })
    ) {
      if (IS_DEMO) leaveDemo();
      localStorage.removeItem("techasset_token");
      localStorage.removeItem("techasset_user");
      navigate("/login", { replace: true });
    }
  };
  const commands = items.filter((x) =>
    (x.label + " " + x.description).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      {mobile && (
        <button
          className="sidebar-backdrop"
          aria-label="Cerrar navegación"
          onClick={() => setMobile(false)}
        />
      )}
      <aside
        className={`sidebar ${mobile ? "sidebar-open" : ""}`}
        aria-label="Navegación principal"
      >
        <Link
          to={user.rol === "Colaborador" ? "/equipos" : "/panel"}
          className="brand"
        >
          <span className="brand-symbol">
            <BrandMark size={26} />
          </span>
          <span>
            TechAsset<small>Inventario tecnológico</small>
          </span>
        </Link>
        <IconButton
          className="mobile-nav-close icon-button"
          label="Cerrar menú"
          icon="close"
          onClick={() => setMobile(false)}
        />
        <div className="workspace-label">
          <span className="workspace-avatar">IS</span>
          <div>
            Innovatech Solutions<small>Espacio de trabajo</small>
          </div>
        </div>
        <nav className="sidebar-navigation">
          {["General", "Operaciones", "Administración"].map((group) => {
            const links = items.filter((x) => x.group === group);
            return links.length ? (
              <div className="nav-group" key={group}>
                <p>{group}</p>
                {links.map((item) => (
                  <NavLink
                    end={item.path === "/"}
                    to={item.path}
                    key={item.path}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? "nav-link-active" : ""}`
                    }
                  >
                    <Icon name={item.icon} />
                    <span>{item.label}</span>
                    <Icon name="chevron" size={14} />
                  </NavLink>
                ))}
              </div>
            ) : null;
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <Icon name="help" />
            <div>
              <strong>¿Necesitas orientación?</strong>
              <p>Consulta los pasos de cada módulo.</p>
              <button onClick={() => setHelp(true)}>
                Abrir ayuda <span>F1</span>
              </button>
            </div>
          </div>
          <button className="sidebar-logout" onClick={logout}>
            <Icon name="logout" size={18} />
            Cerrar sesión
          </button>
          <div className="sidebar-version">TechAsset · Gestión de activos</div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="topbar-context">
            <IconButton
              className="icon-button mobile-menu"
              label="Abrir navegación"
              icon="menu"
              aria-expanded={mobile}
              onClick={() => setMobile(true)}
            />
            <span className="breadcrumb-root">{active.group}</span>
            <Icon name="chevron" size={14} />
            <span className="breadcrumb-current">{active.label}</span>
          </div>
          <div className="topbar-actions">
            <button
              aria-label="Ir a un módulo"
              className="command-trigger"
              onClick={() => {
                setQuery("");
                setCommand(true);
              }}
            >
              <Icon name="search" size={17} />
              <span>Ir a un módulo</span>
              <kbd>Ctrl K</kbd>
            </button>
            <div
              className={`connection ${connected === false ? "connection-offline" : ""}`}
              role="status"
            >
              <span />
              {connected === null
                ? "Conectando"
                : connected
                  ? (IS_DEMO ? "Datos de ejemplo" : "En línea")
                  : "Sin conexión"}
            </div>
            <div className="topbar-divider" />
            <IconButton
              label="Preferencias de lectura"
              icon="settings"
              onClick={() => setSettings(true)}
            />
            <IconButton
              label={
                preferences.theme === "light"
                  ? "Activar modo oscuro"
                  : "Activar modo claro"
              }
              icon={preferences.theme === "light" ? "moon" : "sun"}
              onClick={() =>
                setPreferences({
                  ...preferences,
                  theme: preferences.theme === "light" ? "dark" : "light",
                })
              }
            />
            <IconButton
              label="Ayuda de esta pantalla"
              icon="help"
              onClick={() => setHelp(true)}
            />
            <details className="account-menu">
              <summary aria-label={`Cuenta de ${user.nombres}`}>
                <span className="avatar">
                  {user.nombres.charAt(0)}
                  {user.apellidos.charAt(0)}
                </span>
                <span className="account-label">
                  <strong>{user.nombres}</strong>
                  <small>{roleLabel(user.rol)}</small>
                </span>
              </summary>
              <div className="account-dropdown">
                <strong>
                  {user.nombres} {user.apellidos}
                </strong>
                <p>{user.correo}</p>
                <Button
                  variant="ghost"
                  icon="lock"
                  onClick={() => navigate("/cambiar-contrasena")}
                >
                  Cambiar mi contraseña
                </Button>
                <span>{user.area}</span>
                <hr />
                <button onClick={logout}>
                  <Icon name="logout" size={17} />
                  Cerrar sesión
                </button>
              </div>
            </details>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          {connected === false && (
            <div className="connection-warning" role="alert">
              <Icon name="alert" size={18} />
              <span>
                No se puede conectar con el servidor. Tus cambios sin guardar se
                conservan en el formulario.
              </span>
              <button
                onClick={() =>
                  api
                    .get("/health")
                    .then(() => setConnected(true))
                    .catch(() => setConnected(false))
                }
              >
                Reintentar
              </button>
            </div>
          )}
          <div className="page-content">
            <Outlet />
          </div>
          <footer className="workspace-footer">
            <span>Innovatech Solutions S.A.C.</span>
            <span>Fechas de operación en horario de Perú</span>
          </footer>
        </main>
      </div>
      {settings && <AccessibilityDialog close={() => setSettings(false)} />}{" "}
      {help && (
        <HelpDialog path={location.pathname} close={() => setHelp(false)} />
      )}
      {command && (
        <Modal
          title="Ir a un módulo"
          description="Solo se muestran las secciones disponibles para tu rol."
          close={() => setCommand(false)}
        >
          <Search
            value={query}
            onChange={setQuery}
            placeholder="Buscar por nombre o tarea"
            label="Buscar módulo"
          />
          <div className="command-list">
            {commands.map((x) => (
              <button
                key={x.path}
                onClick={() => {
                  setCommand(false);
                  navigate(x.path);
                }}
              >
                <Icon name={x.icon} />
                <span>
                  <strong>{x.label}</strong>
                  <small>{x.description}</small>
                </span>
                <Icon name="arrow" size={16} />
              </button>
            ))}
            {!commands.length && (
              <p className="muted">
                No hay módulos con ese nombre. Prueba con “inventario” o
                “préstamos”.
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
