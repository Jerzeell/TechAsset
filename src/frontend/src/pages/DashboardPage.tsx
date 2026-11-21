import React, { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { useResource } from "../lib/useResource";
import {
  Loan,
  LoanRequest,
  Movement,
  downloadCsv,
  formatDate,
} from "../lib/models";
import { Alert, Button, DataTable } from "../components/Ui";
import Icon from "../components/Icon";
import MetricArtwork from "../components/MetricArtwork";
type Stats = {
  totalEquipments: number;
  availableEquipments: number;
  loanedEquipments: number;
  maintenanceEquipments: number;
  decommissionedEquipments: number;
  totalLoans: number;
  areaConMayorUso: string;
  areaConMayorUsoCantidad: number;
};
type Area = { area: string; totalLoans: number; activeLoans: number };
type Used = {
  equipmentId: string;
  nombre: string;
  codigoPatrimonial: string;
  categoria: string;
  timesUsed: number;
};
export default function DashboardPage() {
  const [params] = useSearchParams();
  const requestedView = params.get("vista");
  const view =
    requestedView === "reportes" ||
    requestedView === "actividad" ||
    requestedView === "disponibilidad"
      ? requestedView
      : "resumen";
  const report = params.get("reporte") === "equipos" ? "equipos" : "areas";
  useEffect(() => {
    document.getElementById("main-content")?.scrollTo({ top: 0 });
  }, [view, report]);
  const resource = useResource(async () => {
    const [stats, areas, used, active, movements, requests] = await Promise.all(
      [
        api.get<Stats>("/reports/dashboard"),
        api.get<Area[]>("/reports/loans-by-area"),
        api.get<Used[]>("/reports/most-used-equipment"),
        api.get<Loan[]>("/loans/active"),
        api.get<Movement[]>("/movements"),
        api.get<LoanRequest[]>("/requests"),
      ],
    );
    return {
      stats: stats.data,
      areas: areas.data,
      used: used.data,
      active: active.data,
      movements: movements.data,
      requests: requests.data,
    };
  });
  const data = resource.data,
    stats = data?.stats;
  const pending =
    data?.requests.filter((r) => r.estado === "Pendiente").length || 0;
  const cards = stats
    ? [
        {
          label: "Total de equipos",
          value: stats.totalEquipments,
          detail: "Activos registrados",
          icon: "equipment",
          tone: "blue",
          url: "/equipos",
        },
        {
          label: "Disponibles",
          value: stats.availableEquipments,
          detail: "Listos para un nuevo préstamo",
          icon: "check",
          tone: "green",
          url: "/equipos?estado=Disponible",
        },
        {
          label: "Prestados",
          value: stats.loanedEquipments,
          detail: "Asignados a colaboradores",
          icon: "loans",
          tone: "violet",
          url: "/prestamos",
        },
        {
          label: "En mantenimiento",
          value: stats.maintenanceEquipments,
          detail: "Fuera de servicio temporalmente",
          icon: "tools",
          tone: "amber",
          url: "/equipos?estado=Mantenimiento",
        },
        {
          label: "Total de préstamos",
          value: stats.totalLoans,
          detail: "Asignaciones registradas en el historial",
          icon: "history",
          tone: "blue",
          url: "/panel?vista=reportes",
        },
        {
          label: "Área con mayor uso",
          value:
            stats.areaConMayorUso === "Ninguna"
              ? "Sin préstamos"
              : stats.areaConMayorUso,
          detail: `${stats.areaConMayorUsoCantidad} asignaciones históricas`,
          icon: "users",
          tone: "violet",
          url: "/panel?vista=reportes",
        },
      ]
    : [];
  const exportSummary = () => {
    if (!stats) return;
    downloadCsv(
      "TechAsset-resumen",
      ["Indicador", "Valor"],
      [
        ...cards.map((x) => [x.label, x.value]),
        ["Préstamos del área con mayor uso", stats.areaConMayorUsoCantidad],
        ["Equipos dados de baja", stats.decommissionedEquipments],
      ],
    );
  };
  return (
    <div className="page-stack dashboard-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">Vista general</div>
          <h1>Resumen del inventario</h1>
          <p>Disponibilidad, asignaciones y prioridades en un solo lugar.</p>
        </div>
        <div className="page-heading-actions">
          <Button
            variant="secondary"
            icon="download"
            onClick={exportSummary}
            disabled={!stats}
          >
            Exportar resumen
          </Button>
          <Link className="btn btn-primary" to="/prestamos?nuevo=1">
            <Icon name="plus" size={18} />
            Asignar equipo
          </Link>
        </div>
      </div>
      <Alert
        message={resource.error}
        action={
          <Button variant="secondary" onClick={resource.reload}>
            Reintentar
          </Button>
        }
      />
      <nav className="dashboard-view-nav" aria-label="Secciones del panel">
        {[
          { key: "resumen", label: "Resumen", icon: "dashboard" },
          { key: "disponibilidad", label: "Disponibilidad", icon: "equipment" },
          { key: "reportes", label: "Reportes", icon: "loans" },
          { key: "actividad", label: "Actividad", icon: "history" },
        ].map((item) => (
          <Link
            key={item.key}
            data-section={item.key}
            to={"/panel?vista=" + item.key}
            aria-current={view === item.key ? "page" : undefined}
          >
            <Icon name={item.icon} size={20} />
            {item.label}
          </Link>
        ))}
      </nav>
      {view === "reportes" && (
        <nav className="report-view-nav" aria-label="Elegir reporte">
          <Link
            to="/panel?vista=reportes&reporte=areas"
            aria-current={report === "areas" ? "page" : undefined}
          >
            Préstamos por área
          </Link>
          <Link
            to="/panel?vista=reportes&reporte=equipos"
            aria-current={report === "equipos" ? "page" : undefined}
          >
            Equipos más utilizados
          </Link>
        </nav>
      )}
      <div className="data-meta">
        <span>
          <span className="live-dot" />
          Datos del inventario · Acumulado histórico
        </span>
        <button onClick={resource.reload} disabled={resource.loading}>
          <Icon name="refresh" size={15} />
          {resource.loading
            ? "Actualizando…"
            : resource.updated
              ? "Actualizado a las " +
                resource.updated.toLocaleTimeString("es-PE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Actualizar"}
        </button>
      </div>
      <div className="metric-grid" hidden={view !== "resumen"}>
        {resource.loading && !data
          ? [0, 1, 2, 3, 4, 5].map((x) => (
              <div
                key={x}
                className="metric-card skeleton"
                aria-label="Cargando indicador"
              />
            ))
          : cards.map((card) => (
              <Link
                key={card.label}
                className={
                  "metric-card" +
                  (typeof card.value === "string" ? " metric-card-text" : "")
                }
                to={card.url}
                data-tone={card.tone}
              >
                <div className="metric-top">
                  <span>{card.label}</span>
                  <span className={"metric-icon " + card.tone}>
                    <Icon name={card.icon} />
                  </span>
                </div>
                <strong>
                  {typeof card.value === "number"
                    ? card.value.toLocaleString("es-PE")
                    : card.value}
                </strong>
                <MetricArtwork kind={card.icon} />
                <div className="metric-bottom">
                  <span>{card.detail}</span>
                  <Icon name="arrow" size={16} />
                </div>
              </Link>
            ))}
      </div>
      {data && stats && (
        <>
          <div className="dashboard-grid" hidden={view !== "disponibilidad"}>
            <section className="panel availability-panel">
              <div className="panel-heading">
                <div>
                  <h2>Disponibilidad de equipos</h2>
                  <p>Distribución actual del inventario</p>
                </div>
                <span className="subtle-tag">
                  {stats.totalEquipments} equipos
                </span>
              </div>
              {stats.totalEquipments ? (
                <>
                  <div className="segmented-bar" aria-hidden="true">
                    {[
                      {
                        state: "Disponible",
                        value: stats.availableEquipments,
                        tone: "green",
                      },
                      {
                        state: "Prestado",
                        value: stats.loanedEquipments,
                        tone: "violet",
                      },
                      {
                        state: "Mantenimiento",
                        value: stats.maintenanceEquipments,
                        tone: "amber",
                      },
                      {
                        state: "Baja",
                        value: stats.decommissionedEquipments,
                        tone: "slate",
                      },
                    ]
                      .filter((x) => x.value > 0)
                      .map((x) => (
                        <div
                          key={x.state}
                          className={x.tone}
                          style={{
                            width: `${(x.value / stats.totalEquipments) * 100}%`,
                          }}
                        />
                      ))}
                  </div>
                  <div className="state-legend">
                    {[
                      {
                        label: "Disponible",
                        value: stats.availableEquipments,
                        tone: "green",
                      },
                      {
                        label: "Prestado",
                        value: stats.loanedEquipments,
                        tone: "violet",
                      },
                      {
                        label: "Mantenimiento",
                        value: stats.maintenanceEquipments,
                        tone: "amber",
                      },
                      {
                        label: "Baja",
                        value: stats.decommissionedEquipments,
                        tone: "slate",
                      },
                    ].map((x) => (
                      <Link key={x.label} to={"/equipos?estado=" + x.label}>
                        <span className={"legend-dot " + x.tone} />
                        <span>{x.label}</span>
                        <strong>{x.value}</strong>
                        <small>
                          {Math.round((x.value / stats.totalEquipments) * 100)}{" "}
                          %
                        </small>
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <div className="empty-inline">
                  <Icon name="equipment" />
                  <p>El inventario todavía está vacío.</p>
                  <Link to="/equipos?nuevo=1">Registrar el primer equipo</Link>
                </div>
              )}
              <div className="panel-note">
                <Icon name="info" size={16} />
                Selecciona un estado para consultar los equipos.
              </div>
            </section>
            <section className="panel priorities-panel">
              <div className="panel-heading">
                <div>
                  <h2>Requiere tu atención</h2>
                  <p>Continúa con la siguiente operación</p>
                </div>
                <Icon name="requests" />
              </div>
              <Link
                className="priority-item"
                to="/solicitudes?estado=Pendiente"
              >
                <span className="priority-icon violet">
                  <Icon name="requests" />
                </span>
                <div>
                  <strong>Solicitudes pendientes</strong>
                  <p>
                    {pending
                      ? "Revisa y decide las asignaciones"
                      : "No hay solicitudes por revisar"}
                  </p>
                </div>
                <b>{pending}</b>
                <Icon name="chevron" size={16} />
              </Link>
              <Link
                className="priority-item"
                to="/equipos?estado=Mantenimiento"
              >
                <span className="priority-icon amber">
                  <Icon name="tools" />
                </span>
                <div>
                  <strong>Equipos en mantenimiento</strong>
                  <p>Consulta su estado antes de reasignar</p>
                </div>
                <b>{stats.maintenanceEquipments}</b>
                <Icon name="chevron" size={16} />
              </Link>
              <Link className="priority-item" to="/prestamos">
                <span className="priority-icon blue">
                  <Icon name="loans" />
                </span>
                <div>
                  <strong>Préstamos activos</strong>
                  <p>Revisa los equipos por devolver</p>
                </div>
                <b>{data.active.length}</b>
                <Icon name="chevron" size={16} />
              </Link>
            </section>
          </div>
          <div
            className="dashboard-grid dashboard-secondary"
            hidden={
              view !== "actividad" &&
              (view !== "reportes" || report !== "areas")
            }
          >
            <section
              className="panel"
              hidden={view !== "reportes" || report !== "areas"}
            >
              <div className="panel-heading">
                <div>
                  <h2>Préstamos por área</h2>
                  <p>Uso histórico y asignaciones activas</p>
                </div>
                <span className="subtle-tag">{stats.totalLoans} préstamos</span>
              </div>
              {data.areas.length ? (
                <DataTable
                  data={data.areas.map((area) => ({ ...area, id: area.area }))}
                  caption="Préstamos por área"
                  empty={<p>No hay préstamos registrados.</p>}
                  columns={[
                    {
                      key: "area",
                      label: "Área",
                      render: (area) => area.area,
                      sortValue: (area) => area.area,
                    },
                    {
                      key: "total",
                      label: "Préstamos registrados",
                      render: (area) => (
                        <div className="area-report-value">
                          <strong>{area.totalLoans}</strong>
                          <div className="area-track" aria-hidden="true">
                            <span
                              style={{
                                width: `${(area.totalLoans / Math.max(...data.areas.map((a) => a.totalLoans), 1)) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ),
                      sortValue: (area) => area.totalLoans,
                    },
                    {
                      key: "active",
                      label: "Activos",
                      render: (area) => area.activeLoans,
                      sortValue: (area) => area.activeLoans,
                    },
                  ]}
                />
              ) : (
                <div className="empty-inline">
                  <Icon name="loans" />
                  <strong>Los préstamos darán forma a este reporte</strong>
                  <p>
                    Al registrar la primera asignación verás el uso por área.
                  </p>
                  <Link to="/prestamos?nuevo=1">Registrar un préstamo</Link>
                </div>
              )}
              <div className="report-totals">
                <div>
                  <span>Total de préstamos</span>
                  <strong>{stats.totalLoans}</strong>
                </div>
                <div>
                  <span>Área con mayor uso</span>
                  <strong>
                    {stats.areaConMayorUso === "Ninguna"
                      ? "Sin préstamos"
                      : stats.areaConMayorUso}
                  </strong>
                  <small>
                    {stats.areaConMayorUsoCantidad} asignaciones históricas
                  </small>
                </div>
              </div>
            </section>
            <section className="panel" hidden={view !== "actividad"}>
              <div className="panel-heading">
                <div>
                  <h2>Actividad reciente</h2>
                  <p>Últimos movimientos del sistema</p>
                </div>
                <Link className="text-link" to="/movimientos">
                  Ver todo
                  <Icon name="arrow" size={15} />
                </Link>
              </div>
              <DataTable
                data={data.movements}
                caption="Actividad reciente"
                empty={
                  <div className="empty-inline">
                    Las operaciones aparecerán aquí cuando se registren.
                  </div>
                }
                columns={[
                  {
                    key: "detail",
                    label: "Movimiento",
                    render: (m) => <strong>{m.detalle}</strong>,
                  },
                  {
                    key: "actor",
                    label: "Realizado por",
                    render: (m) => m.responsable,
                  },
                  {
                    key: "date",
                    label: "Fecha y hora",
                    render: (m) => formatDate(m.fecha, true),
                  },
                ]}
              />
            </section>
          </div>
          <section
            className="panel usage-panel"
            hidden={view !== "reportes" || report !== "equipos"}
          >
            <div className="panel-heading">
              <div>
                <h2>Equipos más utilizados</h2>
                <p>Hasta cinco equipos con más préstamos registrados</p>
              </div>
              <Link className="text-link" to="/equipos">
                Ir al inventario
                <Icon name="arrow" size={15} />
              </Link>
            </div>
            <DataTable
              data={data.used.map((x) => ({ ...x, id: x.equipmentId }))}
              caption="Equipos más utilizados"
              empty={
                <div className="empty-inline">
                  Todavía no hay préstamos para calcular la frecuencia de uso.
                </div>
              }
              columns={[
                {
                  key: "name",
                  label: "Equipo",
                  render: (x) => <strong>{x.nombre}</strong>,
                },
                {
                  key: "code",
                  label: "Código patrimonial",
                  render: (x) => x.codigoPatrimonial,
                },
                {
                  key: "category",
                  label: "Categoría",
                  render: (x) => x.categoria,
                },
                {
                  key: "count",
                  label: "Préstamos",
                  render: (x) => x.timesUsed,
                },
              ]}
            />
          </section>
        </>
      )}
    </div>
  );
}
