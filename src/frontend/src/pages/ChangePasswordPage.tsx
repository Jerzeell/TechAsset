import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import api from "../services/api";
import { getSessionUser, isSessionExpired, roleLabel } from "../lib/session";
import { validPassword } from "../lib/password";
import { Alert, Button, Field, inputClass, SaveButton } from "../components/Ui";
import BrandMark from "../components/BrandMark";
import Icon from "../components/Icon";
import {
  PasswordControl,
  PasswordChecklist,
} from "../components/PasswordControl";
import { useUi } from "../components/UiProvider";

export default function ChangePasswordPage() {
  const user = getSessionUser(),
    navigate = useNavigate(),
    { notify } = useUi();
  const [step, setStep] = useState(1),
    [form, setForm] = useState({
      currentPassword: "",
      newPassword: "",
      confirmation: "",
    });
  const [errors, setErrors] = useState<Record<string, string>>({}),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    document
      .querySelector<HTMLInputElement>(".activation-wizard form input")
      ?.focus();
  }, [step]);
  if (!user || isSessionExpired())
    return <Navigate to="/login?motivo=sesion" replace />;
  const forced = user.mustChangePassword,
    destination = user.rol === "Colaborador" ? "/equipos" : "/panel";
  const titles = [
    "Tu contraseña actual",
    "Crea tu nueva contraseña",
    "Confirma y guarda",
  ];
  const change = (key: keyof typeof form, value: string) => {
    setForm({ ...form, [key]: value });
    setErrors({ ...errors, [key]: "" });
    setError("");
  };
  const exit = () => {
    if (forced) {
      localStorage.removeItem("techasset_token");
      localStorage.removeItem("techasset_user");
      navigate("/login", { replace: true });
    } else navigate(destination);
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const p: Record<string, string> = {};
    if (step === 1 || step === 3) {
      if (!form.currentPassword)
        p.currentPassword = "Escribe tu contraseña actual o temporal.";
    }
    if (step >= 2) {
      if (!validPassword(form.newPassword))
        p.newPassword = "Completa los cinco requisitos indicados debajo.";
      else if (form.currentPassword === form.newPassword)
        p.newPassword = "Elige una contraseña diferente de la actual.";
    }
    if (
      step === 3 &&
      (!form.confirmation || form.confirmation !== form.newPassword)
    )
      p.confirmation = "Repite exactamente la nueva contraseña.";
    setErrors(p);
    setError("");
    if (Object.keys(p).length) {
      if (p.currentPassword) setStep(1);
      else if (p.newPassword) setStep(2);
      return;
    }
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post("/auth/change-password", form);
      localStorage.setItem("techasset_token", data.token);
      localStorage.setItem("techasset_user", JSON.stringify(data.user));
      notify(
        "Tu contraseña se actualizó. Las sesiones anteriores se cerraron.",
      );
      navigate(destination, { replace: true });
    } catch (e: any) {
      setError(e.message);
      setStep(e.message.toLowerCase().includes("actual") ? 1 : 2);
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="activation-page activation-wizard">
      <div className="activation-shell">
        <aside className="activation-story">
          <a className="activation-brand" href="/">
            <BrandMark size={32} />
            TechAsset
          </a>
          <div className="eyebrow">Tu espacio, protegido</div>
          <h1>
            {forced ? "Activa tu acceso personal." : "Renueva tu acceso."}
          </h1>
          <p>
            {forced
              ? "La contraseña que recibiste es temporal. Debes reemplazarla antes de ingresar a los módulos."
              : "Cambia tu contraseña en tres pasos. La nueva clave será solo tuya."}
          </p>
          <ol className="activation-steps">
            {[
              "Identifica tu acceso",
              "Define tu contraseña",
              "Confirma el cambio",
            ].map((label, i) => (
              <li
                className={
                  step === i + 1 ? "current" : step > i + 1 ? "complete" : ""
                }
                aria-current={step === i + 1 ? "step" : undefined}
                key={label}
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                {label}
                {step > i + 1 && <Icon name="check" size={18} />}
              </li>
            ))}
          </ol>
          <div className="activation-destination">
            <Icon name="arrow" />
            <div>
              Al terminar irás a
              <strong>
                {user.rol === "Colaborador"
                  ? "Inventario disponible"
                  : "Resumen del inventario"}
              </strong>
              <small>
                {roleLabel(user.rol)} · {user.area}
              </small>
            </div>
          </div>
        </aside>
        <section className="activation-form">
          <div className="eyebrow">
            {forced ? "Activación de cuenta" : "Seguridad de la cuenta"} · Paso{" "}
            {step} de 3
          </div>
          <h2>{titles[step - 1]}</h2>
          <p className="login-subtitle">
            <strong>{user.nombres}</strong> · {user.correo}
          </p>
          <Alert message={error} />
          <form onSubmit={submit} noValidate aria-busy={busy}>
            {step === 1 && (
              <>
                <p className="wizard-guidance">
                  Ingresa la contraseña temporal que te entregaron o la
                  contraseña que usas actualmente. Se comprobará en el servidor
                  al guardar el cambio.
                </p>
                <Field
                  label="Contraseña actual o temporal"
                  required
                  error={errors.currentPassword}
                >
                  <PasswordControl
                    key="current"
                    name="currentPassword"
                    className={inputClass}
                    autoComplete="current-password"
                    value={form.currentPassword}
                    disabled={busy}
                    onChange={(e) => change("currentPassword", e.target.value)}
                  />
                </Field>
              </>
            )}
            {step === 2 && (
              <>
                <Field
                  label="Nueva contraseña"
                  required
                  error={errors.newPassword}
                >
                  <PasswordControl
                    key="new"
                    name="newPassword"
                    className={inputClass}
                    autoComplete="new-password"
                    value={form.newPassword}
                    disabled={busy}
                    onChange={(e) => change("newPassword", e.target.value)}
                  />
                </Field>
                <PasswordChecklist value={form.newPassword} />
              </>
            )}
            {step === 3 && (
              <>
                <p className="wizard-guidance">
                  Los cinco requisitos están completos. Repite tu nueva
                  contraseña para confirmar que la escribiste correctamente.
                </p>
                <Field
                  label="Confirmar nueva contraseña"
                  required
                  error={errors.confirmation}
                >
                  <PasswordControl
                    key="confirmation"
                    name="confirmation"
                    className={inputClass}
                    autoComplete="new-password"
                    value={form.confirmation}
                    disabled={busy}
                    onChange={(e) => change("confirmation", e.target.value)}
                  />
                </Field>
                <div className="notice">
                  <Icon name="shield" size={19} />
                  <p>
                    Tu nueva contraseña se guardará de forma segura y se
                    cerrarán las sesiones anteriores.
                  </p>
                </div>
              </>
            )}
            <div className="wizard-controls">
              {step > 1 ? (
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => {
                    setError("");
                    setStep(step - 1);
                  }}
                >
                  Anterior
                </Button>
              ) : (
                <span />
              )}
              {step < 3 ? (
                <Button type="submit" icon="arrow">
                  Continuar
                </Button>
              ) : (
                <SaveButton busy={busy} label="Guardar y entrar" />
              )}
            </div>
            <Button
              className="wizard-exit"
              variant="ghost"
              disabled={busy}
              onClick={exit}
            >
              {forced ? "Salir y continuar después" : "Cancelar"}
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
