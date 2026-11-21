import React from "react";
import Icon from "./Icon";
import { Button } from "./Ui";
export function Badge({ status }: { status: string }) {
  const tone: Record<string, string> = {
    Disponible: "green",
    Prestado: "blue",
    Mantenimiento: "amber",
    Baja: "slate",
    Activo: "green",
    Deshabilitado: "slate",
    Pendiente: "amber",
    Aprobada: "green",
    Rechazada: "red",
    Devuelto: "slate",
  };
  return (
    <span className={`badge badge-${tone[status] || "slate"}`}>
      <span />
      {status}
    </span>
  );
}
export function EmptyState({
  title,
  description,
  icon = "search",
  action,
  label,
}: {
  title: string;
  description: string;
  icon?: string;
  action?: () => void;
  label?: string;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon name={icon} size={28} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action && (
        <Button variant="secondary" onClick={action}>
          {label || "Restablecer filtros"}
        </Button>
      )}
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="page-heading-actions">{children}</div>
    </div>
  );
}
export function ResultCount({
  filtered,
  total,
  label = "registros",
}: {
  filtered: number;
  total: number;
  label?: string;
}) {
  return (
    <p className="results-count" role="status">
      {filtered === total
        ? `${total} ${label}`
        : `${filtered} de ${total} ${label}`}
      <span> · Datos actualizados desde el sistema</span>
    </p>
  );
}
export function FormSection({
  step,
  title,
  description,
  children,
}: {
  step?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="form-section">
      <div className="form-section-heading">
        {step && <span>{step}</span>}
        <div>
          <h3>{title}</h3>
          {description && <p>{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
