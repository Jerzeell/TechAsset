import FilterPanel from "../components/FilterPanel";
import React, { useState } from "react";
import api from "../services/api";
import { Movement, dayInPeru, downloadCsv, formatDate } from "../lib/models";
import { useResource } from "../lib/useResource";
import {
  Alert,
  Button,
  DataTable,
  Field,
  inputClass,
  Search,
} from "../components/Ui";
import { EmptyState, PageHeading, ResultCount } from "../components/Content";
import Icon from "../components/Icon";
import MovementAction, { movementActionLabel } from "../components/MovementAction";
const entities: Record<string, string> = {
  User: "Usuarios",
  Equipment: "Equipos",
  Loan: "Préstamos y devoluciones",
  LoanRequest: "Solicitudes",
};
export default function MovementsPage() {
  const resource = useResource(
    async () => (await api.get<Movement[]>("/movements")).data,
  );
  const [search, setSearch] = useState(""),
    [entity, setEntity] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  const invalid = !!from && !!to && to < from;
  const rows = resource.data || [];
  const filtered = rows.filter(
    (r) =>
      (!entity || r.entidad === entity) &&
      `${r.detalle} ${r.responsable} ${entities[r.entidad] || r.entidad} ${movementActionLabel(r.accion)}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!from || dayInPeru(r.fecha) >= from) &&
      (!to || dayInPeru(r.fecha) <= to),
  );
  const clear = () => {
    setSearch("");
    setEntity("");
    setFrom("");
    setTo("");
  };
  return (
    <div className="page-stack">
      <PageHeading
        eyebrow="Administración"
        title="Cada movimiento, registrado"
        description="Consulta qué cambió, quién realizó la operación y cuándo ocurrió."
      >
        <Button
          variant="secondary"
          icon="download"
          disabled={!filtered.length || invalid}
          onClick={() =>
            downloadCsv(
              "TechAsset-movimientos",
              [
                "Fecha y hora (Perú)",
                "Módulo",
                "Acción",
                "Detalle",
                "Responsable",
              ],
              filtered.map((r) => [
                formatDate(r.fecha, true),
                entities[r.entidad] || r.entidad,
                movementActionLabel(r.accion),
                r.detalle,
                r.responsable,
              ]),
            )
          }
        >
          Exportar consulta
        </Button>
        <Button
          variant="primary"
          icon="refresh"
          disabled={resource.loading}
          onClick={resource.reload}
        >
          Actualizar
        </Button>
      </PageHeading>
      <Alert
        message={resource.error}
        action={<Button onClick={resource.reload}>Reintentar</Button>}
      />
      <div className="notice">
        <Icon name="shield" size={20} />
        <p>
          <strong>Historial de solo lectura.</strong> Los movimientos se generan
          con cada operación para conservar la trazabilidad. No se pueden editar
          ni eliminar desde esta pantalla.
        </p>
      </div>
      <FilterPanel>
        <div className="filter-main">
          <Search
            value={search}
            onChange={setSearch}
            label="Buscar movimientos"
            placeholder="Descripción, acción o responsable"
          />
          <Field label="Módulo">
            <select
              className={inputClass}
              value={entity}
              onChange={(e) => setEntity(e.target.value)}
            >
              <option value="">Todos los módulos</option>
              {Object.entries(entities).map(([v, t]) => (
                <option key={v} value={v}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Desde">
            <input
              className={inputClass}
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
            />
          </Field>
          <Field
            label="Hasta"
            error={invalid ? "Debe ser igual o posterior a Desde." : undefined}
          >
            <input
              className={inputClass}
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
            />
          </Field>
          <Button
            variant="ghost"
            onClick={clear}
            disabled={!search && !entity && !from && !to}
          >
            Limpiar filtros
          </Button>
        </div>
        <div className="filter-summary">
          <ResultCount
            filtered={filtered.length}
            total={rows.length}
            label="movimientos"
          />
          <span>Horario de Perú</span>
        </div>
      </FilterPanel>
      <DataTable
        data={invalid ? [] : filtered}
        loading={resource.loading && !resource.data}
        resetKey={search + entity + from + to}
        caption="Historial de movimientos"
        empty={
          <EmptyState
            icon="history"
            title={
              invalid
                ? "Revisa el rango de fechas"
                : "No hay movimientos para esta consulta"
            }
            description={
              invalid
                ? "La fecha Hasta debe ser igual o posterior a Desde."
                : "Cambia los filtros para encontrar una operación o restablece la consulta."
            }
            action={clear}
          />
        }
        columns={[
          {
            key: "date",
            label: "Fecha y hora",
            sortValue: (r) => r.fecha,
            render: (r) => (
              <span className="date-cell">{formatDate(r.fecha, true)}</span>
            ),
          },
          {
            key: "entity",
            label: "Módulo",
            sortValue: (r) => r.entidad,
            render: (r) => entities[r.entidad] || r.entidad,
          },
          {
            key: "action",
            label: "Acción",
            sortValue: (r) => r.accion,
            render: (r) => (
              <MovementAction action={r.accion} />
            ),
          },
          {
            key: "detail",
            label: "Detalle del movimiento",
            render: (r) => <span className="movement-detail">{r.detalle}</span>,
          },
          {
            key: "responsible",
            label: "Realizado por",
            sortValue: (r) => r.responsable,
            render: (r) => r.responsable,
          },
        ]}
      />
    </div>
  );
}
