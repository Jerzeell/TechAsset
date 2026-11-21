import React from "react";
import { Button, Modal } from "./Ui";
import { useUi } from "./UiProvider";
import Icon from "./Icon";
export default function AccessibilityDialog({ close }: { close: () => void }) {
  const { preferences, setPreferences } = useUi();
  return (
    <Modal
      title="Preferencias de lectura"
      description="Los ajustes se guardan en este navegador y se aplican a todas las pantallas."
      close={close}
    >
      <div className="preference-group">
        <h3>Apariencia</h3>
        <div className="theme-options">
          {(["light", "dark"] as const).map((theme) => (
            <button
              className={preferences.theme === theme ? "selected" : ""}
              key={theme}
              aria-pressed={preferences.theme === theme}
              onClick={() => setPreferences({ ...preferences, theme })}
            >
              <Icon name={theme === "light" ? "sun" : "moon"} />
              {theme === "light" ? "Modo claro" : "Modo oscuro"}
              {preferences.theme === theme && <Icon name="check" size={16} />}
            </button>
          ))}
        </div>
      </div>
      <div className="preference-group">
        <label htmlFor="text-size">
          Tamaño del texto <strong>{preferences.scale}%</strong>
        </label>
        <input
          id="text-size"
          type="range"
          min="85"
          max="130"
          step="5"
          value={preferences.scale}
          onChange={(e) =>
            setPreferences({ ...preferences, scale: Number(e.target.value) })
          }
        />
        <div className="range-labels">
          <span>85 %</span>
          <span>130 %</span>
        </div>
        <p className="field-hint">
          Incluye etiquetas, tablas, mensajes y formularios. También puedes usar
          el zoom del navegador.
        </p>
        <div className="text-preview">
          <strong>Vista previa</strong>
          <p>El equipo está disponible para un nuevo préstamo.</p>
        </div>
      </div>
      <div className="form-actions">
        <Button
          variant="secondary"
          onClick={() => setPreferences({ theme: "dark", scale: 100 })}
        >
          Restablecer
        </Button>
        <Button onClick={close}>Listo</Button>
      </div>
    </Modal>
  );
}
