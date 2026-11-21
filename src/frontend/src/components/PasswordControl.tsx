import React, { useState } from "react";
import Icon from "./Icon";
import { passwordRules } from "../lib/password";
export function PasswordControl(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  const [show, setShow] = useState(false);
  return (
    <div className="password-control">
      <input {...props} type={show ? "text" : "password"} maxLength={128} />
      <button
        type="button"
        className="icon-button"
        aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        aria-pressed={show}
        onClick={() => setShow(!show)}
      >
        <Icon name={show ? "eye-off" : "eye"} />
      </button>
    </div>
  );
}
export function PasswordChecklist({ value }: { value: string }) {
  const completed = passwordRules.filter((rule) => rule.test(value)).length;
  return (
    <div className="password-requirements">
      <p className="password-progress" role="status" aria-live="polite">
        {completed} de {passwordRules.length} requisitos cumplidos
      </p>
      <ul
        className="password-checklist"
        aria-label="Requisitos de la contraseña"
      >
        {passwordRules.map((r) => (
          <li key={r.label} className={r.test(value) ? "met" : "unmet"}>
            <Icon name={r.test(value) ? "check" : "close"} size={18} />
            <span>{r.label}</span>
            <strong className="password-rule-status">
              {r.test(value) ? "Cumplido" : "Pendiente"}
            </strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
