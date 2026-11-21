import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button, Modal } from "./Ui";
import Icon from "./Icon";
type ConfirmOptions = {
  title: string;
  description: string;
  label?: string;
  danger?: boolean;
};
type Preferences = { theme: "light" | "dark"; scale: number };
type UiValue = {
  preferences: Preferences;
  setPreferences: (value: Preferences) => void;
  notify: (message: string, kind?: "success" | "error") => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};
const Context = createContext<UiValue | null>(null);
export function useUi() {
  const value = useContext(Context);
  if (!value) throw new Error("UiProvider missing");
  return value;
}
export default function UiProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [preferences, setPreferences] = useState<Preferences>(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem("techasset_preferences") || "{}",
      );
      return {
        theme: stored.theme === "light" ? "light" : "dark",
        scale: Math.max(85, Math.min(130, Number(stored.scale) || 100)),
      };
    } catch {
      return { theme: "dark", scale: 100 };
    }
  });
  const [notificationError, setNotificationError] = useState(false);
  const [message, setMessage] = useState(""),
    [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<(answer: boolean) => void>();
  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme;
    document.documentElement.style.fontSize = `${(16 * preferences.scale) / 100}px`;
    localStorage.setItem("techasset_preferences", JSON.stringify(preferences));
  }, [preferences]);
  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(() => setMessage(""), 7000);
    return () => clearTimeout(timeout);
  }, [message]);
  const confirm = (value: ConfirmOptions) =>
    new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setOptions(value);
    });
  const answer = (accepted: boolean) => {
    resolver.current?.(accepted);
    setOptions(null);
  };
  return (
    <Context.Provider
      value={{
        preferences,
        setPreferences,
        notify: (message, kind = "success") => {
          setNotificationError(kind === "error");
          setMessage(message);
        },
        confirm,
      }}
    >
      {children}
      <div
        className="toast-region"
        role={notificationError ? "alert" : "status"}
        aria-live={notificationError ? "assertive" : "polite"}
      >
        {message && (
          <div className={`toast ${notificationError ? "toast-error" : ""}`}>
            <Icon name={notificationError ? "alert" : "check"} />
            <span>{message}</span>
            <button
              aria-label="Cerrar notificación"
              onClick={() => setMessage("")}
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        )}
      </div>
      {options && (
        <Modal
          title={options.title}
          description={options.description}
          close={() => answer(false)}
        >
          <div className="form-actions">
            <Button variant="secondary" onClick={() => answer(false)} autoFocus>
              Cancelar
            </Button>
            <Button
              variant={options.danger ? "danger" : "success"}
              onClick={() => answer(true)}
            >
              {options.label || "Confirmar"}
            </Button>
          </div>
        </Modal>
      )}
    </Context.Provider>
  );
}
