import FilterPanel from "../components/FilterPanel";
import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";
import {
  Equipment,
  Loan,
  categories,
  equipmentStates,
  downloadCsv,
} from "../lib/models";
import { getSessionUser } from "../lib/session";
import { useResource } from "../lib/useResource";
import {
  Alert,
  Button,
  DataTable,
  Field,
  IconButton,
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
type EquipmentForm = Omit<Equipment, "id">;
const blank: EquipmentForm = {
  codigoPatrimonial: "",
  nombre: "",
  categoria: "Laptops",
  marca: "",
  estado: "Disponible",
};
export default function EquipmentPage() {
  const user = getSessionUser()!,
    staff = user.rol !== "Colaborador";
  const { confirm, notify } = useUi();
  const [params, setParams] = useSearchParams();
  const resource = useResource(async () => {
    const [equipment, history] = await Promise.all([
      api.get<Equipment[]>("/equipment"),
      staff
        ? api.get<Loan[]>("/loans/history")
        : Promise.resolve({ data: [] as Loan[] }),
    ]);
    return {
      equipment: equipment.data,
      history: new Set(history.data.map((l) => l.equipoId)),
    };
  });
  const [search, setSearch] = useState(""),
    [category, setCategory] = useState(""),
    [state, setState] = useState(params.get("estado") || "");
  const [open, setOpen] = useState(false),
    [editing, setEditing] = useState<Equipment | null>(null),
    [view, setView] = useState<Equipment | null>(null),
    [form, setForm] = useState<EquipmentForm>(blank),
    [initial, setInitial] = useState(""),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const begin = (equipment: Equipment | null) => {
    const next = equipment
      ? {
          codigoPatrimonial: equipment.codigoPatrimonial,
          nombre: equipment.nombre,
          categoria: equipment.categoria,
          marca: equipment.marca,
          estado: equipment.estado,
        }
      : blank;
    setEditing(equipment);
    setForm(next);
    setInitial(JSON.stringify(next));
    setErrors({});
    setError("");
    setOpen(true);
  };
  useEffect(() => {
    if (params.get("nuevo") === "1" && staff) {
      begin(null);
      setParams({}, { replace: true });
    }
  }, []);
  const close = async () => {
    if (busy) return;
    if (
      JSON.stringify(form) !== initial &&
      !(await confirm({
        title: "¿Descartar los cambios?",
        description:
          "Los datos de este formulario todavía no se han guardado. Puedes seguir editando o salir sin guardar.",
        label: "Descartar cambios",
        danger: true,
      }))
    )
      return;
    setOpen(false);
  };
  const change = (key: keyof EquipmentForm, value: string) => {
    setForm({ ...form, [key]: value });
    setErrors({ ...errors, [key]: "" });
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const next = {
      ...form,
      codigoPatrimonial: form.codigoPatrimonial.trim().toUpperCase(),
      nombre: form.nombre.trim(),
      marca: form.marca.trim(),
    };
    const problems: Record<string, string> = {};
    for (const key of [
      "codigoPatrimonial",
      "nombre",
      "marca",
      "categoria",
    ] as const)
      if (!next[key]) problems[key] = "Completa este campo.";
    if (
      resource.data?.equipment.some(
        (x) =>
          x.id !== editing?.id &&
          x.codigoPatrimonial.trim().toUpperCase() === next.codigoPatrimonial,
      )
    )
      problems.codigoPatrimonial =
        "Este código ya está registrado. Usa uno diferente.";
    setErrors(problems);
    setError("");
    if (Object.keys(problems).length) return;
    setBusy(true);
    try {
      editing
        ? await api.put("/equipment/" + editing.id, next)
        : await api.post("/equipment", next);
      setOpen(false);
      notify(
        editing
          ? "Ficha del equipo actualizada."
          : "Equipo registrado y agregado al inventario.",
      );
      await resource.reload();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const remove = async (equipment: Equipment) => {
    if (
      !(await confirm({
        title: "¿Eliminar este equipo?",
        description: `Se eliminará permanentemente ${equipment.codigoPatrimonial} · ${equipment.nombre}. Esta acción solo está permitida si el equipo no tiene historial.`,
        label: "Eliminar equipo",
        danger: true,
      }))
    )
      return;
    try {
      await api.delete("/equipment/" + equipment.id);
      notify("Equipo eliminado del inventario.");
      await resource.reload();
    } catch (e: any) {
      notify(e.message, "error");
    }
  };
  const equipment = resource.data?.equipment || [];
  const filtered = equipment.filter(
    (x) =>
      (!state || x.estado === state) &&
      (!category || x.categoria === category) &&
      `${x.codigoPatrimonial} ${x.nombre} ${x.marca} ${x.categoria}`
        .toLocaleLowerCase("es")
        .includes(search.toLocaleLowerCase("es")),
  );
  const clear = () => {
    setSearch("");
    setCategory("");
    setState("");
    setParams({}, { replace: true });
  };
  const exportRows = () =>
    downloadCsv(
      "TechAsset-inventario",
      ["Código patrimonial", "Equipo", "Categoría", "Marca", "Estado"],
      filtered.map((x) => [
        x.codigoPatrimonial,
        x.nombre,
        x.categoria,
        x.marca,
        x.estado,
      ]),
    );
  return (
    <div className="page-stack">
      <PageHeading
        eyebrow="Operaciones"
        title="Inventario de equipos"
        description={
          staff
            ? "Cada activo, con su estado y datos al día."
            : "Consulta la disponibilidad y encuentra el equipo que necesitas."
        }
      >
        <Button
          variant="secondary"
          icon="download"
          disabled={!filtered.length}
          onClick={exportRows}
        >
          Exportar consulta
        </Button>
        {staff && (
          <Button icon="plus" onClick={() => begin(null)}>
            Registrar equipo
          </Button>
        )}
      </PageHeading>
      <Alert
        message={resource.error}
        action={
          <Button variant="secondary" onClick={resource.reload}>
            Reintentar
          </Button>
        }
      />
      <div className="inventory-counters">
        {[
          { label: "Todos los equipos", value: "", tone: "slate" },
          ...equipmentStates.map((value) => ({
            label:
              value === "Disponible"
                ? "Disponibles"
                : value === "Prestado"
                  ? "Prestados"
                  : value === "Baja"
                    ? "Dados de baja"
                    : "En mantenimiento",
            value,
            tone:
              value === "Disponible"
                ? "green"
                : value === "Prestado"
                  ? "blue"
                  : value === "Mantenimiento"
                    ? "amber"
                    : "slate",
          })),
        ].map((x) => (
          <button
            key={x.value}
            className={`counter-tab ${state === x.value ? "counter-tab-active" : ""}`}
            onClick={() => setState(x.value)}
            aria-pressed={state === x.value}
          >
            <span className={"legend-dot " + x.tone} />
            <span>{x.label}</span>
            <strong>
              {x.value
                ? equipment.filter((e) => e.estado === x.value).length
                : equipment.length}
            </strong>
          </button>
        ))}
      </div>
      <FilterPanel>
        <div className="filter-main">
          <Search
            value={search}
            onChange={setSearch}
            placeholder="Nombre, código patrimonial o marca"
            label="Buscar equipos"
          />
          <Field label="Categoría">
            <select
              className={inputClass}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categories.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Button
            variant="ghost"
            icon="refresh"
            onClick={clear}
            disabled={!search && !category && !state}
          >
            Limpiar filtros
          </Button>
        </div>
        <div className="filter-summary">
          <ResultCount
            filtered={filtered.length}
            total={equipment.length}
            label="equipos"
          />
          <button
            className="text-button"
            onClick={resource.reload}
            disabled={resource.loading}
          >
            <Icon name="refresh" size={15} />
            {resource.loading ? "Actualizando…" : "Actualizar"}
          </button>
        </div>
      </FilterPanel>
      <DataTable
        data={filtered}
        loading={resource.loading && !resource.data}
        resetKey={search + state + category}
        caption="Inventario de equipos"
        empty={
          <EmptyState
            icon="equipment"
            title={
              equipment.length
                ? "No encontramos equipos con esos filtros"
                : "Tu inventario empieza aquí"
            }
            description={
              equipment.length
                ? "Prueba otra palabra o restablece los filtros para ver todos los equipos."
                : staff
                  ? "Registra el primer activo tecnológico para comenzar a controlar su disponibilidad."
                  : "Todavía no hay equipos registrados. Consulta con el área de Tecnología."
            }
            action={
              equipment.length ? clear : staff ? () => begin(null) : undefined
            }
            label={
              equipment.length ? "Restablecer filtros" : "Registrar equipo"
            }
          />
        }
        columns={[
          {
            key: "code",
            label: "Código patrimonial",
            sortValue: (x) => x.codigoPatrimonial,
            render: (x) => (
              <button className="code-link" onClick={() => setView(x)}>
                {x.codigoPatrimonial}
              </button>
            ),
          },
          {
            key: "equipment",
            label: "Equipo",
            sortValue: (x) => x.nombre,
            render: (x) => (
              <div className="entity-cell">
                <span className="entity-icon">
                  <Icon name="equipment" size={19} />
                </span>
                <div>
                  <strong>{x.nombre}</strong>
                  <small>{x.marca}</small>
                </div>
              </div>
            ),
          },
          {
            key: "category",
            label: "Categoría",
            sortValue: (x) => x.categoria,
            render: (x) => x.categoria,
          },
          {
            key: "state",
            label: "Estado",
            sortValue: (x) => x.estado,
            render: (x) => <Badge status={x.estado} />,
          },
          {
            key: "actions",
            label: "Acciones",
            className: "actions-cell",
            render: (x) => (
              <div className="row-actions">
                {staff ? (
                  <>
                    <Button variant="ghost" onClick={() => begin(x)}>
                      Editar
                    </Button>
                    <IconButton
                      icon="trash"
                      className="action-danger"
                      label={
                        resource.data?.history.has(x.id)
                          ? "No se puede eliminar: tiene historial de préstamos"
                          : "Eliminar " + x.codigoPatrimonial
                      }
                      disabled={resource.data?.history.has(x.id)}
                      onClick={() => remove(x)}
                    />
                  </>
                ) : x.estado === "Disponible" ? (
                  <Link
                    className="text-link"
                    to={"/solicitudes?nuevo=1&equipo=" + x.id}
                  >
                    Solicitar
                    <Icon name="arrow" size={15} />
                  </Link>
                ) : (
                  <span className="muted">No disponible</span>
                )}
              </div>
            ),
          },
        ]}
      />
      <div className="page-note">
        <Icon name="info" size={16} />
        {staff
          ? "El estado Prestado se actualiza al registrar una asignación. Los equipos con historial conservan su trazabilidad."
          : "Solo se pueden solicitar equipos disponibles. Tecnología confirmará la asignación."}
      </div>
      {open && (
        <Modal
          title={editing ? "Editar equipo" : "Registrar equipo"}
          description="Los campos marcados con * son obligatorios."
          close={close}
          busy={busy}
        >
          <form onSubmit={save} noValidate aria-busy={busy}>
            <Alert message={error} />
            <FormSection
              step="01"
              title="Identificación del activo"
              description="Usa el código de la etiqueta patrimonial del equipo."
            >
              <Field
                label="Código patrimonial"
                required
                error={errors.codigoPatrimonial}
                hint="Debe ser único. Ejemplo: LAP-2026-001."
              >
                <input
                  className={inputClass}
                  autoFocus
                  maxLength={50}
                  value={form.codigoPatrimonial}
                  onChange={(e) => change("codigoPatrimonial", e.target.value)}
                />
              </Field>
              <Field label="Nombre del equipo" required error={errors.nombre}>
                <input
                  className={inputClass}
                  maxLength={100}
                  value={form.nombre}
                  onChange={(e) => change("nombre", e.target.value)}
                  placeholder="Ejemplo: Laptop Dell Latitude 3420"
                />
              </Field>
              <div className="form-grid">
                <Field label="Categoría" required error={errors.categoria}>
                  <select
                    className={inputClass}
                    value={form.categoria}
                    onChange={(e) => change("categoria", e.target.value)}
                  >
                    {categories.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Marca" required error={errors.marca}>
                  <input
                    className={inputClass}
                    maxLength={50}
                    value={form.marca}
                    onChange={(e) => change("marca", e.target.value)}
                    placeholder="Ejemplo: Dell"
                  />
                </Field>
              </div>
            </FormSection>
            <FormSection step="02" title="Disponibilidad">
              <Field
                label="Estado del equipo"
                required
                hint={
                  editing?.estado === "Prestado"
                    ? "Para cambiar este estado, registra primero la devolución."
                    : "Elige Disponible solo si el equipo está listo para asignarse."
                }
              >
                <select
                  className={inputClass}
                  value={form.estado}
                  disabled={editing?.estado === "Prestado"}
                  onChange={(e) => change("estado", e.target.value)}
                >
                  {equipmentStates
                    .filter(
                      (x) => x !== "Prestado" || editing?.estado === "Prestado",
                    )
                    .map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                </select>
              </Field>
            </FormSection>
            <div className="form-actions">
              <Button variant="secondary" onClick={close} disabled={busy}>
                Cancelar
              </Button>
              <SaveButton
                busy={busy}
                label={editing ? "Guardar cambios" : "Registrar equipo"}
              />
            </div>
          </form>
        </Modal>
      )}
      {view && (
        <Modal
          title="Ficha del equipo"
          description={view.codigoPatrimonial}
          close={() => setView(null)}
        >
          <div className="equipment-detail">
            <span className="large-entity-icon">
              <Icon name="equipment" size={34} />
            </span>
            <h3>{view.nombre}</h3>
            <Badge status={view.estado} />
          </div>
          <dl className="detail-list">
            <div>
              <dt>Categoría</dt>
              <dd>{view.categoria}</dd>
            </div>
            <div>
              <dt>Marca</dt>
              <dd>{view.marca}</dd>
            </div>
            <div>
              <dt>Código patrimonial</dt>
              <dd>{view.codigoPatrimonial}</dd>
            </div>
          </dl>
          <div className="form-actions">
            <Button variant="secondary" onClick={() => setView(null)}>
              Cerrar
            </Button>
            {staff ? (
              <Button
                onClick={() => {
                  setView(null);
                  begin(view);
                }}
              >
                Editar ficha
              </Button>
            ) : (
              view.estado === "Disponible" && (
                <Link
                  className="btn btn-primary"
                  to={"/solicitudes?nuevo=1&equipo=" + view.id}
                >
                  Solicitar equipo
                </Link>
              )
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
