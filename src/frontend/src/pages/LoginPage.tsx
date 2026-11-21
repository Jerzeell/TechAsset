import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import BrandMark from "../components/BrandMark";
import Icon from "../components/Icon";
import { Alert, Button, Field, IconButton, Modal } from "../components/Ui";
import { useUi } from "../components/UiProvider";
import AccessHelp from "../components/AccessHelp";
import AccessibilityDialog from "../components/AccessibilityDialog";
import { getSessionUser, isSessionExpired } from "../lib/session";
export default function LoginPage() {
  const navigate = useNavigate(),
    location = useLocation();
  const { preferences, setPreferences } = useUi();
  const [email, setEmail] = useState(
      () => localStorage.getItem("techasset_remembered_email") || "",
    ),
    [password, setPassword] = useState(""),
    [remember, setRemember] = useState(
      !!localStorage.getItem("techasset_remembered_email"),
    );
  const [visible, setVisible] = useState(false),
    [caps, setCaps] = useState(false),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [help, setHelp] = useState(false),
    [settings, setSettings] = useState(false),
    [online, setOnline] = useState<boolean | null>(null);
  const expired =
    new URLSearchParams(location.search).get("motivo") === "sesion";
  useEffect(() => {
    const user = getSessionUser();
    if (user && !isSessionExpired())
      navigate(
        user.mustChangePassword
          ? "/cambiar-contrasena"
          : user.rol === "Colaborador"
            ? "/equipos"
            : "/panel",
        {
          replace: true,
        },
      );
    api
      .get("/health")
      .then(() => setOnline(true))
      .catch(() => setOnline(false));
  }, [navigate]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const problems: Record<string, string> = {};
    if (!email.trim()) problems.email = "Escribe tu correo electrónico.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      problems.email =
        "Escribe un correo válido, por ejemplo: nombre@empresa.com.";
    if (!password) problems.password = "Escribe tu contraseña.";
    setErrors(problems);
    setError("");
    if (Object.keys(problems).length) {
      document
        .querySelector<HTMLInputElement>(
          Object.keys(problems)[0] === "email"
            ? 'input[type="email"]'
            : 'input[name="password"]',
        )
        ?.focus();
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });
      localStorage.setItem("techasset_token", data.token);
      localStorage.setItem("techasset_user", JSON.stringify(data.user));
      if (remember)
        localStorage.setItem("techasset_remembered_email", email.trim());
      else localStorage.removeItem("techasset_remembered_email");
      const from = (location.state as { from?: string } | null)?.from;
      const safeFrom =
        from && from.startsWith("/") && !from.startsWith("//") ? from : null;
      navigate(
        data.user.mustChangePassword
          ? "/cambiar-contrasena"
          : safeFrom ||
              (data.user.rol === "Colaborador" ? "/equipos" : "/panel"),
        { replace: true },
      );
    } catch (e: any) {
      setError(
        e.response?.status === 401
          ? "El correo o la contraseña no son correctos. Revisa ambos datos e inténtalo de nuevo."
          : e.response?.status === 400
            ? "No se pudo iniciar sesión. Revisa tus datos o consulta al administrador si tu cuenta está habilitada."
            : "No se puede conectar con el servidor. Comprueba la conexión y vuelve a intentar.",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="login-page">
      <a href="#login-form" className="skip-link">
        Ir al formulario de acceso
      </a>
      <section className="login-story" aria-label="Acerca de TechAsset">
        <div className="login-brand">
          <span className="brand-symbol">
            <BrandMark size={26} />
          </span>
          <span>TechAsset</span>
          <small>INNOVATECH SOLUTIONS</small>
        </div>
        <div className="login-story-content">
          <div className="eyebrow">
            <span />
            Gestión de activos tecnológicos
          </div>
          <h1>
            Cada equipo.
            <br />
            Cada préstamo.
            <br />
            <em>Todo bajo control.</em>
          </h1>
          <p>
            Una sola plataforma para conocer la disponibilidad de tus equipos y
            seguir cada asignación, desde la entrega hasta la devolución.
          </p>
          <div className="login-visual-space" aria-hidden="true" />
          <div className="login-process">
            <span>
              <b>01</b>Consulta
            </span>
            <Icon name="chevron" size={14} />
            <span>
              <b>02</b>Asigna
            </span>
            <Icon name="chevron" size={14} />
            <span>
              <b>03</b>Devuelve
            </span>
          </div>
        </div>
        <footer className="login-story-footer">
          <Icon name="shield" size={18} />
          <span>Acceso según el rol y los permisos de tu cuenta.</span>
        </footer>
      </section>
      <section className="login-access">
        <div className="login-tools">
          <a className="text-button" href="/">
            Volver al inicio
          </a>
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
          <button className="text-button" onClick={() => setHelp(true)}>
            <Icon name="help" size={17} />
            Ayuda
          </button>
        </div>
        <div className="login-form-wrap">
          <div className="login-mobile-brand">
            <BrandMark />
            TechAsset
          </div>
          <div className="login-heading-icon">
            <Icon name="lock" size={24} />
          </div>
          <div className="eyebrow login-eyebrow">Bienvenido a TechAsset</div>
          <h2>Inicia sesión</h2>
          <p className="login-subtitle">
            Ingresa con tu cuenta para acceder a tu espacio de trabajo.
          </p>
          {expired && (
            <div className="notice" role="status">
              <Icon name="info" size={18} />
              <p>Tu sesión finalizó. Vuelve a ingresar para continuar.</p>
            </div>
          )}
          <Alert message={error} />
          <form
            id="login-form"
            onSubmit={submit}
            noValidate
            className="login-form"
            aria-busy={loading}
          >
            <Field label="Correo electrónico" error={errors.email} required>
              <div className="login-control">
                <Icon name="mail" size={19} />
                <input
                  name="email"
                  type="email"
                  autoComplete="username"
                  inputMode="email"
                  value={email}
                  aria-label="Correo electrónico"
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors({ ...errors, email: "" });
                  }}
                  placeholder="nombre@empresa.com"
                  disabled={loading}
                />
              </div>
            </Field>
            <Field label="Contraseña" error={errors.password} required>
              <div className="login-control">
                <Icon name="lock" size={19} />
                <input
                  name="password"
                  type={visible ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  aria-label="Contraseña"
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors({ ...errors, password: "" });
                  }}
                  onKeyUp={(e) => setCaps(e.getModifierState("CapsLock"))}
                  onKeyDown={(e) => setCaps(e.getModifierState("CapsLock"))}
                  placeholder="Ingresa tu contraseña"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setVisible(!visible)}
                  aria-label={
                    visible ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  aria-pressed={visible}
                >
                  <Icon name={visible ? "eye-off" : "eye"} size={19} />
                </button>
              </div>
            </Field>
            {caps && (
              <p className="caps-warning" role="status">
                <Icon name="alert" size={15} />
                Bloq Mayús está activado.
              </p>
            )}
            <div className="login-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Recordar mi correo
              </label>
              <button
                type="button"
                className="text-button"
                onClick={() => setHelp(true)}
              >
                ¿Necesitas acceso?
              </button>
            </div>
            <Button
              type="submit"
              className="login-submit"
              disabled={loading}
              icon={loading ? "refresh" : "arrow"}
            >
              {loading ? "Verificando acceso…" : "Ingresar al sistema"}
            </Button>
          </form>
          <div className="login-security">
            <Icon name="shield" size={17} />
            <p>
              ¿Es tu primer ingreso? Usa la contraseña temporal que recibiste.
              Te pediremos crear una contraseña personal antes de continuar.
            </p>
          </div>
          <div
            className={`login-server ${online === false ? "is-offline" : ""}`}
            role="status"
          >
            <span />
            {online === null
              ? "Comprobando disponibilidad"
              : online
                ? "Servidor disponible"
                : "Servidor sin conexión"}
            {online === false && (
              <button
                className="text-button"
                onClick={() =>
                  api
                    .get("/health")
                    .then(() => setOnline(true))
                    .catch(() => setOnline(false))
                }
              >
                Reintentar
              </button>
            )}
          </div>
        </div>
        <footer className="login-access-footer">
          © {new Date().getFullYear()} Innovatech Solutions S.A.C.
        </footer>
      </section>
      {settings && <AccessibilityDialog close={() => setSettings(false)} />}{" "}
      {help && <AccessHelp close={() => setHelp(false)} />}
    </div>
  );
}
