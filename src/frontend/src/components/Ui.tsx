import React, { useEffect, useId, useRef, useState } from "react";
import Icon from "./Icon";
import { PasswordControl } from "./PasswordControl";
export function Button({
  children,
  variant = "primary",
  icon,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "ghost";
  icon?: string;
}) {
  return (
    <button
      type="button"
      className={`btn btn-${variant} ${className}`}
      {...props}
    >
      {icon && <Icon name={icon} size={18} />}
      <span>{children}</span>
    </button>
  );
}
export function IconButton({
  label,
  icon,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  icon: string;
}) {
  return (
    <button
      type="button"
      className="icon-button"
      title={label}
      aria-label={label}
      {...props}
    >
      <Icon name={icon} />
    </button>
  );
}
export function Alert({
  message,
  success = false,
  action,
  onClose,
}: {
  message: string;
  success?: boolean;
  action?: React.ReactNode;
  onClose?: () => void;
}) {
  if (!message) return null;
  return (
    <div
      className={`alert ${success ? "alert-success" : "alert-error"}`}
      role={success ? "status" : "alert"}
    >
      <Icon name={success ? "check" : "alert"} />
      <div className="alert-body">
        {message}
        {action && <div className="alert-action">{action}</div>}
      </div>
      {onClose && (
        <IconButton label="Cerrar mensaje" icon="close" onClick={onClose} />
      )}
    </div>
  );
}
export function Modal({
  title,
  description,
  close,
  children,
  busy = false,
  wide = false,
}: {
  title: string;
  description?: string;
  close: () => void;
  children: React.ReactNode;
  busy?: boolean;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    id = useId();
  useEffect(() => {
    const dialog = ref.current;
    const prior = document.activeElement as HTMLElement;
    dialog?.showModal();
    const focusFrame = requestAnimationFrame(() =>
      dialog
        ?.querySelector<HTMLElement>(
          'input:not([type="hidden"]),select,textarea',
        )
        ?.focus(),
    );
    document.body.classList.add("dialog-open");
    return () => {
      cancelAnimationFrame(focusFrame);
      dialog?.close();
      if (!document.querySelector("dialog[open]"))
        document.body.classList.remove("dialog-open");
      prior?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "modal-wide" : ""}`}
      aria-modal="true"
      aria-labelledby={id}
      aria-describedby={description ? id + "-description" : undefined}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) close();
      }}
    >
      <div className="modal-header">
        <div>
          <h2 id={id}>{title}</h2>
          {description && <p id={id + "-description"}>{description}</p>}
        </div>
        <IconButton
          label="Cerrar diálogo"
          icon="close"
          onClick={close}
          disabled={busy}
        />
      </div>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}
export const inputClass = "input";
export function Field({
  label,
  children,
  error,
  hint,
  required = false,
}: {
  label: string;
  children: React.ReactElement;
  error?: string;
  hint?: string;
  required?: boolean;
}) {
  const id = useId();
  useEffect(() => {
    if (error) {
      const frame = requestAnimationFrame(() => {
        const form = document.getElementById(id)?.closest("form");
        const first = form?.querySelector<HTMLElement>("[aria-invalid=true]");
        if (first?.id === id) first.focus();
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [error, id]);
  const description = error ? id + "-error" : hint ? id + "-hint" : undefined;
  const bind = (node: React.ReactNode): React.ReactNode => {
    if (!React.isValidElement<any>(node)) return node;
    if (
      node.type === PasswordControl ||
      (typeof node.type === "string" &&
        ["input", "select", "textarea"].includes(node.type))
    )
      return React.cloneElement(node, {
        id,
        required: required || node.props.required,
        "aria-invalid": !!error,
        "aria-describedby": description,
      });
    return node.props.children
      ? React.cloneElement(node, {
          children: React.Children.map(node.props.children, bind),
        })
      : node;
  };
  return (
    <div className={`field ${error ? "field-error" : ""}`}>
      <label htmlFor={id}>
        {label}
        {required && (
          <span className="required-mark" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      {bind(children)}
      {error ? (
        <p className="field-feedback" id={id + "-error"}>
          <Icon name="alert" size={14} />
          {error}
        </p>
      ) : (
        hint && (
          <p className="field-hint" id={id + "-hint"}>
            {hint}
          </p>
        )
      )}
    </div>
  );
}
export function SaveButton({
  busy,
  label = "Guardar cambios",
}: {
  busy: boolean;
  label?: string;
}) {
  return (
    <Button
      type="submit"
      variant="success"
      disabled={busy}
      icon={busy ? "refresh" : "check"}
      className={busy ? "is-loading" : ""}
    >
      {busy ? "Guardando…" : label}
    </Button>
  );
}
export function Search({
  value,
  onChange,
  placeholder = "Buscar",
  label = "Buscar en la lista",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
}) {
  return (
    <div className="search-field">
      <Icon name="search" size={18} />
      <input
        data-page-search
        type="search"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button
          type="button"
          aria-label="Borrar búsqueda"
          onClick={() => onChange("")}
        >
          <Icon name="close" size={16} />
        </button>
      )}
    </div>
  );
}
export function Loading({
  label = "Cargando información",
}: {
  label?: string;
}) {
  return (
    <div role="status" className="loading-state">
      <span className="spinner" />
      {label}…
    </div>
  );
}
export type Column<T> = {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
};
export function DataTable<T extends { id: string }>({
  data,
  columns,
  loading = false,
  caption,
  empty,
  resetKey = "",
}: {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  caption: string;
  empty: React.ReactNode;
  resetKey?: string;
}) {
  const [sort, setSort] = useState<{ key: string; direction: number } | null>(
      null,
    ),
    [page, setPage] = useState(1),
    [size, setSize] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tallestRow = useRef(0);
  const hintId = useId();
  const [overflowing, setOverflowing] = useState(false);
  useEffect(() => {
    const region = scrollRef.current;
    if (!region) return;
    const update = () => {
      setOverflowing(region.scrollWidth > region.clientWidth + 1);
      const fitted = window.matchMedia(
        "(min-width: 801px) and (min-height: 601px)",
      ).matches;
      if (!fitted) {
        setSize(5);
        return;
      }
      const rows = Array.from(region.querySelectorAll("tbody tr"));
      const header =
        region.querySelector("thead")?.getBoundingClientRect().height || 0;
      const height = Math.max(
        1,
        ...rows.map((row) => row.getBoundingClientRect().height),
      );
      tallestRow.current = Math.max(tallestRow.current, height);
      const available = region.clientHeight - header - 3;
      if (available > 0)
        setSize(
          Math.max(
            1,
            Math.min(
              20,
              Math.floor(available / Math.max(tallestRow.current, 56)),
            ),
          ),
        );
    };
    const observer = new ResizeObserver(update);
    observer.observe(region);
    const table = region.querySelector("table");
    if (table) observer.observe(table);
    update();
    return () => observer.disconnect();
  }, [loading, data.length, columns.length]);
  useEffect(() => {
    setPage(1);
    tallestRow.current = 0;
  }, [resetKey]);
  const column = columns.find((c) => c.key === sort?.key);
  const sorted = column?.sortValue
    ? [...data].sort((a, b) => {
        const x = column.sortValue!(a),
          y = column.sortValue!(b);
        return (
          (typeof x === "number" && typeof y === "number"
            ? x - y
            : String(x).localeCompare(String(y), "es", { numeric: true })) *
          sort!.direction
        );
      })
    : data;
  const max = Math.max(1, Math.ceil(data.length / size));
  const current = Math.min(page, max);
  const start = (current - 1) * size;
  return (
    <section className="table-card" aria-label={caption}>
      {loading ? (
        <Loading />
      ) : !data.length ? (
        empty
      ) : (
        <>
          <p className="table-scroll-hint" id={hintId} hidden={!overflowing}>
            <Icon name="arrow" size={18} />
            Desliza la tabla horizontalmente para ver todas las columnas y
            acciones.
          </p>
          <div
            ref={scrollRef}
            className="table-scroll"
            aria-describedby={overflowing ? hintId : undefined}
            tabIndex={overflowing ? 0 : undefined}
            role="region"
            aria-label={
              caption + "; deslice horizontalmente para ver todas las columnas"
            }
          >
            <table>
              <caption className="sr-only">{caption}</caption>
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      scope="col"
                      className={c.className}
                      aria-sort={
                        sort?.key === c.key
                          ? sort.direction === 1
                            ? "ascending"
                            : "descending"
                          : undefined
                      }
                    >
                      {c.sortValue ? (
                        <button
                          className="sort-button"
                          onClick={() => {
                            setSort({
                              key: c.key,
                              direction:
                                sort?.key === c.key ? -sort.direction : 1,
                            });
                            setPage(1);
                          }}
                        >
                          {c.label}
                          <Icon name="sort" size={14} />
                        </button>
                      ) : (
                        c.label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.slice(start, start + size).map((row) => (
                  <tr key={row.id}>
                    {columns.map((c) => (
                      <td key={c.key} className={c.className}>
                        {c.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <p aria-live="polite">
              {start + 1}–{Math.min(start + size, data.length)} de {data.length}{" "}
              registros
            </p>
            <div className="pagination">
              <span
                className="page-size"
                title="La cantidad se ajusta a la altura disponible para mostrar filas completas"
              >
                {size} por página
              </span>
              <Button
                variant="ghost"
                disabled={current === 1}
                onClick={() => setPage(current - 1)}
              >
                Anterior
              </Button>
              <span>
                {current} / {max}
              </span>
              <Button
                variant="ghost"
                disabled={current === max}
                onClick={() => setPage(current + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
export { localDateTime, formatDate } from "../lib/models";
