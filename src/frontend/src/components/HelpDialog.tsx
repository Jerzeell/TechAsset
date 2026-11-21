import React from "react";
import { Modal } from "./Ui";
const help: Record<string, { title: string; steps: string[]; note: string }> = {
  "/": {
    title: "Leer el resumen",
    steps: [
      "Revisa la disponibilidad y los equipos que requieren atención.",
      "Abre una tarjeta para consultar su listado filtrado.",
      "Consulta los préstamos por área, el uso de equipos y los últimos movimientos.",
    ],
    note: "Los indicadores provienen de la base de datos. Un estado vacío significa que todavía no hay registros para esa consulta.",
  },
  "/equipos": {
    title: "Gestionar el inventario",
    steps: [
      "Busca por nombre, marca o código patrimonial y combina los filtros.",
      "Usa Registrar equipo para dar de alta un activo. El código debe ser único.",
      "Edita la ficha para actualizar los datos o enviar el equipo a mantenimiento.",
    ],
    note: "El estado Prestado se asigna desde Préstamos. Un equipo con historial no puede eliminarse.",
  },
  "/prestamos": {
    title: "Registrar préstamos y devoluciones",
    steps: [
      "Selecciona Registrar préstamo, un usuario activo y un equipo disponible.",
      "Revisa la fecha, el equipo y el responsable antes de guardar.",
      "Para recibir un equipo, elige Registrar devolución e indica sus condiciones.",
    ],
    note: "Solo Tecnología y Administración registran asignaciones y devoluciones. La devolución debe ser posterior al préstamo y tener observaciones.",
  },
  "/solicitudes": {
    title: "Solicitar y aprobar un equipo",
    steps: [
      "El colaborador selecciona un equipo disponible y explica el motivo.",
      "Tecnología revisa la solicitud y decide aprobarla o rechazarla.",
      "Al aprobar, se registra el préstamo y el equipo pasa a Prestado.",
    ],
    note: "Enviar una solicitud no reserva el equipo. La disponibilidad se vuelve a validar al aprobar.",
  },
  "/usuarios": {
    title: "Administrar usuarios",
    steps: [
      "Registra los datos de la persona, su área y el rol adecuado.",
      "En Editar puedes actualizar los datos sin cambiar la contraseña.",
      "Deshabilitar revoca el acceso y conserva el historial de la persona.",
    ],
    note: "Solo Administración gestiona los usuarios. No puedes deshabilitar tu propia cuenta.",
  },
  "/movimientos": {
    title: "Consultar la trazabilidad",
    steps: [
      "Busca por descripción o responsable de la operación.",
      "Filtra por tipo de registro y rango de fechas.",
      "Exporta la consulta actual si necesitas revisar los datos fuera del sistema.",
    ],
    note: "El historial se genera con cada operación. Esta pantalla es de consulta: no permite editar ni borrar movimientos.",
  },
};
export default function HelpDialog({
  path,
  close,
}: {
  path: string;
  close: () => void;
}) {
  const section = help[path] || help["/"];
  return (
    <Modal title="Ayuda de uso" description={section.title} close={close}>
      <ol className="help-steps">
        {section.steps.map((s, i) => (
          <li key={s}>
            <span>{i + 1}</span>
            <p>{s}</p>
          </li>
        ))}
      </ol>
      <div className="notice">
        <p>{section.note}</p>
      </div>
      <h3 className="section-label">Atajos de teclado</h3>
      <dl className="shortcut-list">
        <div>
          <dt>
            <kbd>Ctrl</kbd> + <kbd>K</kbd>
          </dt>
          <dd>Ir a un módulo</dd>
        </div>
        <div>
          <dt>
            <kbd>/</kbd>
          </dt>
          <dd>Enfocar el buscador de la página</dd>
        </div>
        <div>
          <dt>
            <kbd>F1</kbd>
          </dt>
          <dd>Abrir esta ayuda</dd>
        </div>
        <div>
          <dt>
            <kbd>Esc</kbd>
          </dt>
          <dd>Cerrar un diálogo o cancelar</dd>
        </div>
        <div>
          <dt>
            <kbd>Tab</kbd>
          </dt>
          <dd>Recorrer los controles</dd>
        </div>
      </dl>
    </Modal>
  );
}
