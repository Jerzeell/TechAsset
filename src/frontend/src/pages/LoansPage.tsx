import FilterPanel from "../components/FilterPanel";
import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";
import {
  Equipment,
  Loan,
  LoanRequest,
  User,
  dayInPeru,
  downloadCsv,
  formatDate,
  localDateTime,
} from "../lib/models";
import { getSessionUser } from "../lib/session";
import { useResource } from "../lib/useResource";
import {
  Alert,
  Button,
  DataTable,
  Field,
  inputClass,
  Modal,
  SaveButton,
  Search,
} from "../components/Ui";
import {
  Badge,
  EmptyState,
  FormSection,
  PageHeading,
  ResultCount,
} from "../components/Content";
import { useUi } from "../components/UiProvider";
import Icon from "../components/Icon";
type Form = {
  userId: string;
  equipmentId: string;
  date: string;
  obs: string;
  state: string;
};
export default function LoansPage({
  view = "loans",
}: {
  view?: "loans" | "requests";
}) {
  const user = getSessionUser()!,
    staff = user.rol !== "Colaborador",
    requestsView = view === "requests";
  const { confirm, notify } = useUi();
  const [params, setParams] = useSearchParams();
  const resource = useResource(async () => {
    const [loans, requests, equipment, users] = await Promise.all([
      api.get<Loan[]>("/loans/history"),
      api.get<LoanRequest[]>("/requests"),
      api.get<Equipment[]>("/equipment"),
      staff
        ? api.get<User[]>("/users")
        : Promise.resolve({ data: [] as User[] }),
    ]);
    return {
      loans: loans.data,
      requests: requests.data,
      equipment: equipment.data,
      users: users.data,
    };
  });
  const [search, setSearch] = useState(""),
    [tab, setTab] = useState<"active" | "history">("active"),
    [area, setArea] = useState(""),
    [state, setState] = useState("Pendiente"),
    [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  const [modal, setModal] = useState<"loan" | "request" | "return" | null>(
      null,
    ),
    [returning, setReturning] = useState<Loan | null>(null),
    [detail, setDetail] = useState<Loan | null>(null),
    [busy, setBusy] = useState(false),
    [processing, setProcessing] = useState(""),
    [form, setForm] = useState<Form>({
      userId: "",
      equipmentId: "",
      date: localDateTime(),
      obs: "",
      state: "Disponible",
    }),
    [initial, setInitial] = useState(""),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [error, setError] = useState("");
  const open = (mode: "loan" | "request" | "return", loan?: Loan) => {
    const next = {
      userId: mode === "request" ? user.id : "",
      equipmentId: mode === "request" ? params.get("equipo") || "" : "",
      date: localDateTime(),
      obs: "",
      state: "Disponible",
    };
    setForm(next);
    setInitial(JSON.stringify(next));
    setReturning(loan || null);
    setErrors({});
    setError("");
    setModal(mode);
  };
  useEffect(() => {
    setSearch("");
    if (params.get("nuevo") === "1") {
      open(requestsView || !staff ? "request" : "loan");
      setParams({}, { replace: true });
    }
  }, [view]);
  const close = async () => {
    if (busy) return;
    if (
      JSON.stringify(form) !== initial &&
      !(await confirm({
        title: "¿Descartar los cambios?",
        description:
          "Todavía no se ha registrado esta operación. Puedes continuar completando el formulario o salir sin guardar.",
        label: "Descartar cambios",
        danger: true,
      }))
    )
      return;
    setModal(null);
  };
  const change = (key: keyof Form, value: string) => {
    setForm({ ...form, [key]: value });
    setErrors({ ...errors, [key]: "" });
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const problems: Record<string, string> = {};
    if (modal !== "return" && !form.equipmentId)
      problems.equipmentId = "Selecciona un equipo disponible.";
    if (modal === "loan" && !form.userId)
      problems.userId = "Selecciona a la persona responsable del equipo.";
    if (modal !== "request") {
      if (!form.date) problems.date = "Indica la fecha y hora.";
      else if (new Date(form.date) > new Date())
        problems.date = "La fecha no puede ser futura.";
      else if (
        modal === "return" &&
        returning &&
        new Date(form.date) <= new Date(returning.fechaPrestamo)
      )
        problems.date = "La devolución debe ser posterior al préstamo.";
    }
    if ((modal === "return" || modal === "request") && !form.obs.trim())
      problems.obs =
        modal === "return"
          ? "Describe las condiciones en que recibes el equipo."
          : "Explica para qué necesitas el equipo.";
    setErrors(problems);
    setError("");
    if (Object.keys(problems).length) return;
    setBusy(true);
    try {
      if (modal === "return") {
        await api.post("/loans/" + returning!.id + "/return", {
          fechaDevolucion: new Date(form.date).toISOString(),
          observacion: form.obs.trim(),
          estadoEquipo: form.state,
        });
        notify(
          "Devolución registrada. El equipo queda " +
            (form.state === "Disponible"
              ? "disponible para asignarse."
              : "en mantenimiento."),
        );
      } else if (modal === "request") {
        await api.post("/requests", {
          equipoId: form.equipmentId,
          motivo: form.obs.trim(),
        });
        notify(
          "Solicitud enviada. Tecnología revisará la disponibilidad antes de aprobar.",
        );
        setState("Pendiente");
      } else {
        await api.post("/loans", {
          usuarioId: form.userId,
          equipoId: form.equipmentId,
          fechaPrestamo: new Date(form.date).toISOString(),
          observacion: form.obs.trim(),
        });
        notify(
          "Préstamo registrado. El equipo ahora está asignado al colaborador.",
        );
        setTab("active");
      }
      setModal(null);
      await resource.reload();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const process = async (r: LoanRequest, action: "approve" | "reject") => {
    if (processing) return;
    const accept = action === "approve";
    if (
      !(await confirm({
        title: accept
          ? "¿Aprobar y asignar este equipo?"
          : "¿Rechazar esta solicitud?",
        description: accept
          ? `${r.equipoNombre} se asignará a ${r.usuarioNombre}. El sistema volverá a verificar su disponibilidad.`
          : `La solicitud de ${r.usuarioNombre} para ${r.equipoNombre} quedará rechazada y se conservará en el historial.`,
        label: accept ? "Aprobar y asignar" : "Rechazar solicitud",
        danger: !accept,
      }))
    )
      return;
    setProcessing(r.id);
    try {
      await api.post("/requests/" + r.id + "/" + action);
      notify(
        accept
          ? "Solicitud aprobada. El préstamo ya aparece entre las asignaciones activas."
          : "Solicitud rechazada. El registro se conserva para consulta.",
      );
      await resource.reload();
    } catch (e: any) {
      notify(e.message, "error");
    } finally {
      setProcessing("");
    }
  };
  const loans = resource.data?.loans || [],
    requests = resource.data?.requests || [],
    equipment = resource.data?.equipment || [],
    available = equipment.filter((e) => e.estado === "Disponible"),
    active = loans.filter((l) => !l.fechaDevolucion),
    activeUsers = resource.data?.users.filter((u) => u.estado) || [];
  const invalid = !!from && !!to && to < from;
  const current = tab === "active" ? active : loans;
  const filteredLoans = current.filter(
    (l) =>
      (!area || l.areaPrestamo === area) &&
      `${l.usuarioNombre} ${l.usuarioCorreo} ${l.equipoNombre} ${l.equipoCodigoPatrimonial}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!from || dayInPeru(l.fechaPrestamo) >= from) &&
      (!to || dayInPeru(l.fechaPrestamo) <= to),
  );
  const filteredRequests = requests.filter(
    (r) =>
      (!state || r.estado === state) &&
      `${r.usuarioNombre} ${r.equipoNombre} ${r.motivo}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const clear = () => {
    setSearch("");
    setArea("");
    setState("");
    setFrom("");
    setTo("");
  };
  const selectedEquipment = equipment.find((e) => e.id === form.equipmentId),
    selectedUser = resource.data?.users.find((u) => u.id === form.userId);
  const hasLoanFilters = !!search || !!area || !!from || !!to;
  return (
    <div className="page-stack">
      <PageHeading
        eyebrow="Operaciones"
        title={
          requestsView
            ? "Solicitudes de equipos"
            : staff
              ? "Préstamos y devoluciones"
              : "Mis préstamos"
        }
        description={
          requestsView
            ? staff
              ? "Revisa los motivos y decide qué equipos pueden asignarse."
              : "Solicita un equipo disponible y sigue el estado de tu solicitud."
            : staff
              ? "Controla las asignaciones activas y consulta su historial."
              : "Consulta los equipos que tienes asignados y tus devoluciones."
        }
      >
        <Button
          variant="secondary"
          icon="download"
          disabled={
            requestsView
              ? !filteredRequests.length
              : !filteredLoans.length || invalid
          }
          onClick={() =>
            requestsView
              ? downloadCsv(
                  "TechAsset-solicitudes",
                  ["Fecha (Perú)", "Colaborador", "Equipo", "Motivo", "Estado"],
                  filteredRequests.map((r) => [
                    formatDate(r.fechaSolicitud, true),
                    r.usuarioNombre,
                    r.equipoNombre,
                    r.motivo,
                    r.estado,
                  ]),
                )
              : downloadCsv(
                  "TechAsset-prestamos",
                  [
                    "Código",
                    "Equipo",
                    "Colaborador",
                    "Área",
                    "Préstamo (Perú)",
                    "Devolución (Perú)",
                    "Observación de entrega",
                    "Observación de devolución",
                  ],
                  filteredLoans.map((l) => [
                    l.equipoCodigoPatrimonial,
                    l.equipoNombre,
                    l.usuarioNombre,
                    l.areaPrestamo,
                    formatDate(l.fechaPrestamo, true),
                    formatDate(l.fechaDevolucion, true),
                    l.observacion,
                    l.observacionDevolucion,
                  ]),
                )
          }
        >
          Exportar consulta
        </Button>
        {requestsView || staff ? (
          <Button
            icon="plus"
            disabled={!resource.data}
            onClick={() => open(requestsView ? "request" : "loan")}
          >
            {requestsView ? "Solicitar equipo" : "Registrar préstamo"}
          </Button>
        ) : (
          <Link className="btn btn-primary" to="/solicitudes?nuevo=1">
            <Icon name="plus" size={18} />
            Solicitar equipo
          </Link>
        )}
      </PageHeading>
      <Alert
        message={resource.error}
        action={<Button onClick={resource.reload}>Reintentar</Button>}
      />
      {requestsView ? (
        <>
          <div className="inventory-counters">
            {[
              { value: "Pendiente", label: "Pendientes" },
              { value: "Aprobada", label: "Aprobadas" },
              { value: "Rechazada", label: "Rechazadas" },
              { value: "", label: "Todas las solicitudes" },
            ].map((s) => (
              <button
                key={s.value}
                className={`counter-tab ${state === s.value ? "counter-tab-active" : ""}`}
                aria-pressed={state === s.value}
                onClick={() => setState(s.value)}
              >
                <span>{s.label}</span>
                <strong>
                  {
                    requests.filter((r) => !s.value || r.estado === s.value)
                      .length
                  }
                </strong>
              </button>
            ))}
          </div>
          <FilterPanel>
            <div className="filter-main">
              <Search
                value={search}
                onChange={setSearch}
                placeholder="Equipo, colaborador o motivo"
                label="Buscar solicitudes"
              />
              <Button variant="ghost" onClick={clear}>
                Limpiar filtros
              </Button>
            </div>
            <div className="filter-summary">
              <ResultCount
                filtered={filteredRequests.length}
                total={requests.length}
                label="solicitudes"
              />
              <button className="text-button" onClick={resource.reload}>
                <Icon name="refresh" size={15} />
                Actualizar
              </button>
            </div>
          </FilterPanel>
          <DataTable
            data={filteredRequests}
            caption="Solicitudes de equipos"
            resetKey={search + state}
            loading={resource.loading && !resource.data}
            empty={
              <EmptyState
                icon="requests"
                title={
                  requests.length
                    ? "No hay solicitudes con este estado"
                    : "Todavía no hay solicitudes"
                }
                description={
                  requests.length
                    ? "Selecciona otro estado para revisar las solicitudes anteriores."
                    : "Al solicitar un equipo, aquí podrás seguir su aprobación por Tecnología."
                }
                action={requests.length ? clear : () => open("request")}
                label={
                  requests.length
                    ? "Ver todas las solicitudes"
                    : "Solicitar un equipo"
                }
              />
            }
            columns={[
              {
                key: "request",
                label: "Solicitud",
                sortValue: (r) => r.fechaSolicitud,
                render: (r) => (
                  <div className="stacked-cell">
                    <strong>{r.equipoNombre}</strong>
                    <small>{formatDate(r.fechaSolicitud, true)}</small>
                  </div>
                ),
              },
              {
                key: "user",
                label: "Solicitante",
                sortValue: (r) => r.usuarioNombre,
                render: (r) => r.usuarioNombre,
              },
              {
                key: "reason",
                label: "Motivo",
                render: (r) => (
                  <span className="movement-detail">{r.motivo}</span>
                ),
              },
              {
                key: "state",
                label: "Estado",
                sortValue: (r) => r.estado,
                render: (r) => <Badge status={r.estado} />,
              },
              {
                key: "actions",
                label: "Acciones",
                className: "actions-cell",
                render: (r) =>
                  staff && r.estado === "Pendiente" ? (
                    <div className="row-actions">
                      <Button
                        variant="success"
                        icon="check"
                        disabled={!!processing}
                        onClick={() => process(r, "approve")}
                      >
                        Aprobar
                      </Button>
                      <Button
                        variant="ghost"
                        className="danger-text"
                        icon="close"
                        disabled={!!processing}
                        onClick={() => process(r, "reject")}
                      >
                        Rechazar
                      </Button>
                    </div>
                  ) : (
                    <span className="muted">
                      {r.estado === "Pendiente"
                        ? "En revisión"
                        : r.estado === "Aprobada"
                          ? "Equipo asignado"
                          : "Cerrada"}
                    </span>
                  ),
              },
            ]}
          />
          <div className="page-note">
            <Icon name="info" size={17} />
            Solicitar un equipo no lo reserva. La disponibilidad se verifica
            nuevamente al aprobar.
          </div>
        </>
      ) : (
        <>
          <div className="tabs" role="group" aria-label="Vista de préstamos">
            <button
              className={tab === "active" ? "tab-active" : ""}
              aria-pressed={tab === "active"}
              onClick={() => setTab("active")}
            >
              Préstamos activos<span>{active.length}</span>
            </button>
            <button
              className={tab === "history" ? "tab-active" : ""}
              aria-pressed={tab === "history"}
              onClick={() => setTab("history")}
            >
              Historial completo<span>{loans.length}</span>
            </button>
          </div>
          <section className="filter-panel">
            <div className="filter-main">
              <Search
                value={search}
                onChange={setSearch}
                label="Buscar préstamos"
                placeholder="Equipo, código o colaborador"
              />
              {staff && (
                <Field label="Área">
                  <select
                    className={inputClass}
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                  >
                    <option value="">Todas las áreas</option>
                    {[...new Set(loans.map((l) => l.areaPrestamo))]
                      .filter(Boolean)
                      .sort()
                      .map((a) => (
                        <option key={a}>{a}</option>
                      ))}
                  </select>
                </Field>
              )}
              <Field label="Desde">
                <input
                  type="date"
                  className={inputClass}
                  value={from}
                  max={to || undefined}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </Field>
              <Field
                label="Hasta"
                error={
                  invalid ? "Debe ser igual o posterior a Desde." : undefined
                }
              >
                <input
                  type="date"
                  className={inputClass}
                  value={to}
                  min={from || undefined}
                  onChange={(e) => setTo(e.target.value)}
                />
              </Field>
              <Button
                variant="ghost"
                onClick={clear}
                disabled={!hasLoanFilters}
              >
                Limpiar filtros
              </Button>
            </div>
            <div className="filter-summary">
              <ResultCount
                filtered={filteredLoans.length}
                total={current.length}
                label="préstamos"
              />
              <button className="text-button" onClick={resource.reload}>
                <Icon name="refresh" size={15} />
                Actualizar
              </button>
            </div>
          </section>
          <DataTable
            data={invalid ? [] : filteredLoans}
            loading={resource.loading && !resource.data}
            caption="Préstamos de equipos"
            resetKey={search + area + from + to + tab}
            empty={
              <EmptyState
                icon="loans"
                title={
                  invalid
                    ? "Revisa el rango de fechas"
                    : hasLoanFilters
                      ? "No hay préstamos con esos filtros"
                      : tab === "active"
                        ? "No hay equipos pendientes de devolución"
                        : "El historial de préstamos está vacío"
                }
                description={
                  invalid
                    ? "La fecha Hasta debe ser igual o posterior a Desde."
                    : hasLoanFilters
                      ? "Prueba otra búsqueda o restablece los filtros."
                      : tab === "active"
                        ? "Las próximas asignaciones activas aparecerán aquí."
                        : "Al registrar un préstamo se conservarán aquí los datos de entrega y devolución."
                }
                action={
                  hasLoanFilters || invalid
                    ? clear
                    : staff
                      ? () => open("loan")
                      : undefined
                }
                label={
                  hasLoanFilters || invalid
                    ? "Restablecer filtros"
                    : "Registrar préstamo"
                }
              />
            }
            columns={[
              {
                key: "equipment",
                label: "Equipo",
                sortValue: (l) => l.equipoNombre,
                render: (l) => (
                  <div className="stacked-cell">
                    <strong>{l.equipoNombre}</strong>
                    <small className="code-text">
                      {l.equipoCodigoPatrimonial}
                    </small>
                  </div>
                ),
              },
              {
                key: "user",
                label: "Colaborador",
                sortValue: (l) => l.usuarioNombre,
                render: (l) => (
                  <div className="stacked-cell">
                    <strong>{l.usuarioNombre}</strong>
                    <small>{l.areaPrestamo}</small>
                  </div>
                ),
              },
              {
                key: "date",
                label: "Fecha de préstamo",
                sortValue: (l) => l.fechaPrestamo,
                render: (l) => formatDate(l.fechaPrestamo, true),
              },
              {
                key: "state",
                label: "Estado",
                sortValue: (l) => l.fechaDevolucion || "",
                render: (l) => (
                  <div className="stacked-cell">
                    <Badge
                      status={l.fechaDevolucion ? "Devuelto" : "Prestado"}
                    />
                    {l.fechaDevolucion && (
                      <small>{formatDate(l.fechaDevolucion, true)}</small>
                    )}
                  </div>
                ),
              },
              {
                key: "actions",
                label: "Acciones",
                className: "actions-cell",
                render: (l) => (
                  <div className="row-actions">
                    <Button variant="ghost" onClick={() => setDetail(l)}>
                      Ver detalle
                    </Button>
                    {staff && !l.fechaDevolucion && (
                      <Button
                        variant="success"
                        icon="check"
                        onClick={() => open("return", l)}
                      >
                        Registrar devolución
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
          />
          <div className="page-note">
            <Icon name="info" size={17} />
            Las observaciones de entrega y devolución se conservan por separado.
            Los préstamos del historial no se eliminan.
          </div>
        </>
      )}
      {modal && (
        <Modal
          title={
            modal === "return"
              ? "Registrar devolución"
              : modal === "request"
                ? "Solicitar equipo"
                : "Registrar préstamo"
          }
          description="Revisa los datos antes de confirmar. Los campos con * son obligatorios."
          close={close}
          busy={busy}
          wide
        >
          <form noValidate onSubmit={save} aria-busy={busy}>
            <Alert message={error} />
            <div className="operation-layout">
              <div>
                <FormSection
                  step="01"
                  title={
                    modal === "return"
                      ? "Recepción del equipo"
                      : modal === "request"
                        ? "Equipo y motivo"
                        : "Equipo y colaborador"
                  }
                >
                  {modal === "return" ? (
                    <div className="selected-asset">
                      <Icon name="equipment" size={25} />
                      <div>
                        <strong>{returning?.equipoNombre}</strong>
                        <small>
                          {returning?.equipoCodigoPatrimonial} ·{" "}
                          {returning?.usuarioNombre}
                        </small>
                      </div>
                    </div>
                  ) : (
                    <>
                      {modal === "loan" && (
                        <Field
                          label="Colaborador responsable"
                          required
                          error={errors.userId}
                        >
                          <select
                            autoFocus
                            className={inputClass}
                            value={form.userId}
                            onChange={(e) => change("userId", e.target.value)}
                          >
                            <option value="">
                              Selecciona un usuario activo
                            </option>
                            {activeUsers.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.nombres} {u.apellidos} · {u.area}
                              </option>
                            ))}
                          </select>
                        </Field>
                      )}
                      <Field
                        label="Equipo disponible"
                        required
                        error={errors.equipmentId}
                        hint="Solo se muestran los equipos listos para asignarse."
                      >
                        <select
                          autoFocus={modal === "request"}
                          className={inputClass}
                          value={form.equipmentId}
                          onChange={(e) =>
                            change("equipmentId", e.target.value)
                          }
                        >
                          <option value="">Selecciona un equipo</option>
                          {available.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.codigoPatrimonial} · {e.nombre}
                            </option>
                          ))}
                        </select>
                      </Field>
                      {!available.length && (
                        <div className="notice">
                          <Icon name="info" size={18} />
                          <p>
                            No hay equipos disponibles. Puedes cancelar y
                            consultar el inventario.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  {modal !== "request" && (
                    <Field
                      label={
                        modal === "return"
                          ? "Fecha y hora de devolución"
                          : "Fecha y hora de préstamo"
                      }
                      required
                      error={errors.date}
                      hint="Se usa la hora local del equipo. El historial se muestra en horario de Perú."
                    >
                      <input
                        className={inputClass}
                        type="datetime-local"
                        step="1"
                        value={form.date}
                        max={localDateTime()}
                        onChange={(e) => change("date", e.target.value)}
                      />
                    </Field>
                  )}
                  <Field
                    label={
                      modal === "return"
                        ? "Observaciones de devolución"
                        : modal === "request"
                          ? "Motivo de la solicitud"
                          : "Observaciones de entrega"
                    }
                    required={modal !== "loan"}
                    error={errors.obs}
                    hint={
                      modal === "return"
                        ? "Indica el estado físico y los accesorios recibidos."
                        : modal === "request"
                          ? "Describe la actividad para la que necesitas el equipo."
                          : "Puedes indicar los accesorios y las condiciones de entrega."
                    }
                  >
                    <textarea
                      className={inputClass}
                      rows={4}
                      maxLength={2000}
                      value={form.obs}
                      onChange={(e) => change("obs", e.target.value)}
                      placeholder={
                        modal === "return"
                          ? "Ejemplo: Se recibe operativo, con cargador original."
                          : modal === "request"
                            ? "Ejemplo: Presentación del proyecto al cliente."
                            : "Ejemplo: Se entrega con cargador y maletín."
                      }
                    />
                  </Field>
                  {modal === "return" && (
                    <Field
                      label="Estado del equipo recibido"
                      required
                      hint="Selecciona Mantenimiento si necesita revisión antes de otro préstamo."
                    >
                      <select
                        className={inputClass}
                        value={form.state}
                        onChange={(e) => change("state", e.target.value)}
                      >
                        <option>Disponible</option>
                        <option>Mantenimiento</option>
                      </select>
                    </Field>
                  )}
                </FormSection>
              </div>
              <aside className="operation-review">
                <h3>Resumen de la operación</h3>
                <dl>
                  <div>
                    <dt>Equipo</dt>
                    <dd>
                      {modal === "return"
                        ? returning?.equipoNombre
                        : selectedEquipment?.nombre || "Sin seleccionar"}
                    </dd>
                  </div>
                  <div>
                    <dt>Colaborador</dt>
                    <dd>
                      {modal === "return"
                        ? returning?.usuarioNombre
                        : modal === "request"
                          ? user.nombres + " " + user.apellidos
                          : selectedUser
                            ? selectedUser.nombres +
                              " " +
                              selectedUser.apellidos
                            : "Sin seleccionar"}
                    </dd>
                  </div>
                  <div>
                    <dt>
                      {modal === "return"
                        ? "Estado al recibir"
                        : "Al confirmar"}
                    </dt>
                    <dd>
                      {modal === "return"
                        ? form.state
                        : modal === "request"
                          ? "Pendiente de aprobación"
                          : "Equipo asignado"}
                    </dd>
                  </div>
                  {modal !== "request" && (
                    <div>
                      <dt>Registrado por</dt>
                      <dd>
                        {user.nombres} {user.apellidos}
                      </dd>
                    </div>
                  )}
                </dl>
                <div className="review-note">
                  <Icon name="shield" size={18} />
                  <p>
                    {modal === "request"
                      ? "Tecnología revisará tu solicitud antes de asignar el equipo."
                      : "Al confirmar se actualiza el inventario y se registra el movimiento."}
                  </p>
                </div>
              </aside>
            </div>
            <div className="form-actions">
              <Button variant="secondary" onClick={close} disabled={busy}>
                Cancelar
              </Button>
              <SaveButton
                busy={busy}
                label={
                  modal === "return"
                    ? "Confirmar devolución"
                    : modal === "request"
                      ? "Enviar solicitud"
                      : "Confirmar préstamo"
                }
              />
            </div>
          </form>
        </Modal>
      )}
      {detail && (
        <Modal
          title="Detalle del préstamo"
          description={
            detail.equipoCodigoPatrimonial + " · " + detail.equipoNombre
          }
          close={() => setDetail(null)}
        >
          <Badge status={detail.fechaDevolucion ? "Devuelto" : "Prestado"} />
          <dl className="detail-list">
            <div>
              <dt>Colaborador</dt>
              <dd>{detail.usuarioNombre}</dd>
            </div>
            <div>
              <dt>Área al prestar</dt>
              <dd>{detail.areaPrestamo}</dd>
            </div>
            <div>
              <dt>Préstamo</dt>
              <dd>{formatDate(detail.fechaPrestamo, true)}</dd>
            </div>
            <div>
              <dt>Devolución</dt>
              <dd>{formatDate(detail.fechaDevolucion, true)}</dd>
            </div>
          </dl>
          <div className="detail-observation">
            <h3>Observaciones de entrega</h3>
            <p>
              {detail.observacion ||
                "No se registraron observaciones de entrega."}
            </p>
          </div>
          {detail.fechaDevolucion && (
            <div className="detail-observation">
              <h3>Observaciones de devolución</h3>
              <p>{detail.observacionDevolucion}</p>
            </div>
          )}
          <div className="form-actions">
            <Button variant="secondary" onClick={() => setDetail(null)}>
              Cerrar
            </Button>
            {staff && !detail.fechaDevolucion && (
              <Button
                onClick={() => {
                  setDetail(null);
                  open("return", detail);
                }}
              >
                Registrar devolución
              </Button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
