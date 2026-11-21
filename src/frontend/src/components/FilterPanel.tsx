import React, { useEffect, useId, useState } from "react";
import Icon from "./Icon";
export default function FilterPanel({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false),
    id = useId();
  useEffect(() => {
    const reveal = () => setOpen(true);
    window.addEventListener("techasset:search", reveal);
    return () => window.removeEventListener("techasset:search", reveal);
  }, []);
  return (
    <section
      className="filter-panel"
      data-open={open}
      aria-label="Búsqueda y filtros"
    >
      <button
        className="filter-toggle"
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        <Icon name="search" size={19} />
        <strong>{open ? "Mostrar resultados" : "Buscar y filtrar"}</strong>
        <span>{open ? "Cerrar filtros" : "Abrir filtros"}</span>
        <Icon name="chevron" size={16} />
      </button>
      {React.Children.map(children, (child) =>
        React.isValidElement<any>(child) &&
        String(child.props.className || "")
          .split(" ")
          .includes("filter-main")
          ? React.cloneElement(child, { id, hidden: !open })
          : child,
      )}
    </section>
  );
}
