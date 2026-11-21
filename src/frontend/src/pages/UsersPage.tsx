import FilterPanel from "../components/FilterPanel";
import React, { useState } from "react";
import api from "../services/api";
import { User, downloadCsv } from "../lib/models";
import { getSessionUser, roleLabel } from "../lib/session";
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
import {
  PasswordControl,
  PasswordChecklist,
} from "../components/PasswordControl";
import { validPassword, generateTemporaryPassword } from "../lib/password";
import Icon from "../components/Icon";
const initialForm = {
  nombres: "",
  apellidos: "",
  correo: "",
  area: "",
  password: "",
  confirmation: "",
  rol: "Colaborador",
};
export default function UsersPage() {
  const { confirm, notify } = useUi(),
    current = getSessionUser()!;
  const resource = useResource(
    async () => (await api.get<User[]>("/users")).data,
  );
  const [search, setSearch] = useState(""),
    [area, setArea] = useState(""),
    [state, setState] = useState(""),
    [role, setRole] = useState("");
  const [open, setOpen] = useState(false),
    [editing, setEditing] = useState<User | null>(null),
    [form, setForm] = useState(initialForm),
    [initial, setInitial] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [errors, setErrors] = useState<Record<string, string>>({});
  const begin = (u: User | null) => {
    const next = u
      ? {
          nombres: u.nombres,
          apellidos: u.apellidos,
          correo: u.correo,
          area: u.area,
          rol: u.rol,
          password: "",
          confirmation: "",
        }
      : initialForm;
    setForm(next);
    setInitial(JSON.stringify(next));
    setEditing(u);
    setErrors({});
    setError("");
    setOpen(true);
  };
  const close = async () => {
    if (busy) return;
    if (
      JSON.stringify(form) !== initial &&
      !(await confirm({
        title: "¿Descartar los cambios?",
        description:
          "El perfil no se ha guardado. Puedes continuar editando o descartar estos cambios.",
        label: "Descartar cambios",
        danger: true,
      }))
    )
      return;
    setOpen(false);
  };
  const change = (key: keyof typeof initialForm, value: string) => {
    setForm({ ...form, [key]: value });
    setErrors({ ...errors, [key]: "" });
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const p: Record<string, string> = {};
    for (const key of ["nombres", "apellidos", "area"] as const)
      if (!form[key].trim()) p[key] = "Completa este campo.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo.trim()))
      p.correo = "Escribe un correo electrónico válido.";
    if (
      resource.data?.some(
        (u) =>
          u.id !== editing?.id &&
          u.correo.toLowerCase() === form.correo.trim().toLowerCase(),
      )
    )
      p.correo = "Este correo ya está registrado.";
    if ((!editing || form.password) && !validPassword(form.password))
      p.password =
        "Completa los cinco requisitos de seguridad indicados debajo.";
    if (form.password !== form.confirmation)
      p.confirmation = "Las contraseñas no coinciden.";
    setErrors(p);
    setError("");
    if (Object.keys(p).length) return;
    setBusy(true);
    try {
      const data = {
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        correo: form.correo.trim(),
        area: form.area.trim(),
        rol: form.rol,
        password: form.password,
      };
      editing
        ? await api.put("/users/" + editing.id, data)
        : await api.post("/users", data);
      setOpen(false);
      notify(
        editing
          ? "Datos del usuario actualizados."
          : "Cuenta creada. Al ingresar deberá cambiar la contraseña temporal.",
      );
      await resource.reload();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const disable = async (u: User) => {
    if (
      !(await confirm({
        title: "¿Deshabilitar este usuario?",
        description: `${u.nombres} ${u.apellidos} perderá el acceso a TechAsset. Su historial y los préstamos existentes se conservarán.`,
        label: "Deshabilitar usuario",
        danger: true,
      }))
    )
      return;
    try {
      await api.delete("/users/" + u.id);
      notify("Usuario deshabilitado. El historial permanece disponible.");
      await resource.reload();
    } catch (e: any) {
      notify(e.message, "error");
    }
  };
  const users = resource.data || [],
    filtered = users.filter(
      (u) =>
        `${u.nombres} ${u.apellidos} ${u.correo}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (!area || u.area === area) &&
        (!role || u.rol === role) &&
        (!state || String(u.estado) === state),
    );
  const clear = () => {
    setSearch("");
    setArea("");
    setState("");
    setRole("");
  };
  return (
    <div className="page-stack">
      <PageHeading
        eyebrow="Administración"
        title="Personas y permisos"
        description="Administra las cuentas, áreas de trabajo y niveles de acceso."
      >
        <Button
          variant="secondary"
          icon="download"
          disabled={!filtered.length}
          onClick={() =>
            downloadCsv(
              "TechAsset-usuarios",
              ["Nombres", "Apellidos", "Correo", "Área", "Rol", "Estado"],
              filtered.map((u) => [
                u.nombres,
                u.apellidos,
                u.correo,
                u.area,
                roleLabel(u.rol),
                u.estado ? "Activo" : "Deshabilitado",
              ]),
            )
          }
        >
          Exportar consulta
        </Button>
        <Button icon="plus" onClick={() => begin(null)}>
          Registrar usuario
        </Button>
      </PageHeading>
      <Alert
        message={resource.error}
        action={<Button onClick={resource.reload}>Reintentar</Button>}
      />
      <div className="summary-strip">
        <div>
          <Icon name="users" />
          <span>
            Usuarios registrados<strong>{users.length}</strong>
          </span>
        </div>
        <div>
          <span className="legend-dot green" />
          <span>
            Cuentas activas
            <strong>{users.filter((u) => u.estado).length}</strong>
          </span>
        </div>
        <div>
          <span className="legend-dot slate" />
          <span>
            Deshabilitadas
            <strong>{users.filter((u) => !u.estado).length}</strong>
          </span>
        </div>
      </div>
      <FilterPanel>
        <div className="filter-main">
          <Search
            value={search}
            onChange={setSearch}
            placeholder="Nombre, apellido o correo"
            label="Buscar usuarios"
          />
          <Field label="Área">
            <select
              className={inputClass}
              value={area}
              onChange={(e) => setArea(e.target.value)}
            >
              <option value="">Todas las áreas</option>
              {[...new Set(users.map((u) => u.area))].sort().map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </Field>
          <Field label="Rol">
            <select
              className={inputClass}
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">Todos los roles</option>
              {["Administrador", "ResponsableTecnologia", "Colaborador"].map(
                (r) => (
                  <option key={r} value={r}>
                    {roleLabel(r)}
                  </option>
                ),
              )}
            </select>
          </Field>
          <Field label="Estado">
            <select
              className={inputClass}
              value={state}
              onChange={(e) => setState(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="true">Activo</option>
              <option value="false">Deshabilitado</option>
            </select>
          </Field>
          <Button
            variant="ghost"
            onClick={clear}
            disabled={!search && !area && !role && !state}
          >
            Limpiar filtros
          </Button>
        </div>
        <div className="filter-summary">
          <ResultCount
            filtered={filtered.length}
            total={users.length}
            label="usuarios"
          />
          <button className="text-button" onClick={resource.reload}>
            <Icon name="refresh" size={15} />
            Actualizar
          </button>
        </div>
      </FilterPanel>
      <DataTable
        data={filtered}
        loading={resource.loading && !resource.data}
        resetKey={search + area + role + state}
        caption="Directorio de usuarios"
        empty={
          <EmptyState
            icon="users"
            title="No encontramos usuarios"
            description="Cambia la búsqueda o restablece los filtros para volver a ver el directorio."
            action={clear}
          />
        }
        columns={[
          {
            key: "name",
            label: "Usuario",
            sortValue: (u) => u.nombres + " " + u.apellidos,
            render: (u) => (
              <div className="entity-cell">
                <span className="person-avatar">
                  {u.nombres.charAt(0)}
                  {u.apellidos.charAt(0)}
                </span>
                <div>
                  <strong>
                    {u.nombres} {u.apellidos}
                    {u.id === current.id && (
                      <small className="you-tag">Tú</small>
                    )}
                  </strong>
                  <small>{u.correo}</small>
                </div>
              </div>
            ),
          },
          {
            key: "area",
            label: "Área",
            sortValue: (u) => u.area,
            render: (u) => u.area,
          },
          {
            key: "role",
            label: "Rol",
            sortValue: (u) => u.rol,
            render: (u) => (
              <span className="role-label">{roleLabel(u.rol)}</span>
            ),
          },
          {
            key: "state",
            label: "Estado",
            sortValue: (u) => String(u.estado),
            render: (u) => (
              <div>
                <Badge status={u.estado ? "Activo" : "Deshabilitado"} />
                {u.estado && u.mustChangePassword && (
                  <small className="activation-pending">
                    Cambio de contraseña pendiente
                  </small>
                )}
              </div>
            ),
          },
          {
            key: "actions",
            label: "Acciones",
            className: "actions-cell",
            render: (u) => (
              <div className="row-actions">
                <Button variant="ghost" onClick={() => begin(u)}>
                  Editar
                </Button>
                {u.estado && (
                  <Button
                    variant="ghost"
                    className="danger-text"
                    icon="close"
                    disabled={u.id === current.id}
                    title={
                      u.id === current.id
                        ? "No puedes deshabilitar tu propia cuenta"
                        : undefined
                    }
                    onClick={() => disable(u)}
                  >
                    Deshabilitar
                  </Button>
                )}
              </div>
            ),
          },
        ]}
      />
      <div className="page-note">
        <Icon name="shield" size={17} />
        Los permisos se validan también en el servidor. Deshabilitar una cuenta
        revoca sus sesiones sin borrar su historial.
      </div>
      {open && (
        <Modal
          title={editing ? "Editar usuario" : "Registrar usuario"}
          description="Los campos marcados con * son obligatorios."
          close={close}
          busy={busy}
        >
          <form onSubmit={save} noValidate aria-busy={busy}>
            <Alert message={error} />
            <FormSection step="01" title="Datos de la persona">
              <div className="form-grid">
                <Field label="Nombres" required error={errors.nombres}>
                  <input
                    className={inputClass}
                    autoFocus
                    maxLength={100}
                    value={form.nombres}
                    onChange={(e) => change("nombres", e.target.value)}
                  />
                </Field>
                <Field label="Apellidos" required error={errors.apellidos}>
                  <input
                    className={inputClass}
                    maxLength={100}
                    value={form.apellidos}
                    onChange={(e) => change("apellidos", e.target.value)}
                  />
                </Field>
              </div>
              <Field
                label="Correo electrónico"
                required
                error={errors.correo}
                hint="Se usará para iniciar sesión. Debe ser único."
              >
                <input
                  type="email"
                  autoComplete="off"
                  maxLength={150}
                  className={inputClass}
                  value={form.correo}
                  onChange={(e) => change("correo", e.target.value)}
                  placeholder="nombre@empresa.com"
                />
              </Field>
              <Field label="Área de trabajo" required error={errors.area}>
                <input
                  className={inputClass}
                  list="techasset-areas"
                  maxLength={100}
                  value={form.area}
                  onChange={(e) => change("area", e.target.value)}
                  placeholder="Ejemplo: Sistemas"
                />
              </Field>
              <datalist id="techasset-areas">
                {[...new Set(users.map((u) => u.area))].map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </datalist>
            </FormSection>
            <FormSection step="02" title="Acceso y permisos">
              <Field
                label="Rol"
                required
                hint={
                  form.rol === "Administrador"
                    ? "Puede gestionar usuarios y supervisar todas las operaciones."
                    : form.rol === "ResponsableTecnologia"
                      ? "Puede gestionar equipos, aprobar solicitudes y registrar devoluciones."
                      : "Puede consultar equipos, enviar solicitudes y ver sus propios préstamos."
                }
              >
                <select
                  className={inputClass}
                  value={form.rol}
                  disabled={editing?.id === current.id}
                  onChange={(e) => change("rol", e.target.value)}
                >
                  {[
                    "Colaborador",
                    "ResponsableTecnologia",
                    "Administrador",
                  ].map((r) => (
                    <option value={r} key={r}>
                      {roleLabel(r)}
                    </option>
                  ))}
                </select>
              </Field>
              {editing?.id === current.id && (
                <p className="field-hint">
                  Tu rol debe ser modificado por otro administrador.
                </p>
              )}
              <Field
                label={
                  editing
                    ? "Restablecer contraseña temporal (opcional)"
                    : "Contraseña temporal"
                }
                required={!editing}
                error={errors.password}
                hint={
                  editing
                    ? "Déjala vacía para conservarla. Si la reemplazas, se cerrarán sus sesiones y deberá cambiarla al ingresar."
                    : "Compártela de forma privada. La persona deberá reemplazarla en el primer ingreso."
                }
              >
                <PasswordControl
                  className={inputClass}
                  autoComplete="new-password"
                  minLength={8}
                  value={form.password}
                  onChange={(e) => change("password", e.target.value)}
                />
              </Field>
              <Button
                variant="secondary"
                icon="refresh"
                onClick={() => {
                  const password = generateTemporaryPassword();
                  setForm({ ...form, password, confirmation: password });
                  setErrors({ ...errors, password: "", confirmation: "" });
                }}
              >
                Generar contraseña temporal segura
              </Button>
              {(!editing || form.password) && (
                <PasswordChecklist value={form.password} />
              )}
              {(!editing || form.password) && (
                <Field
                  label="Confirmar contraseña"
                  required
                  error={errors.confirmation}
                >
                  <input
                    className={inputClass}
                    type="password"
                    autoComplete="new-password"
                    maxLength={128}
                    value={form.confirmation}
                    onChange={(e) => change("confirmation", e.target.value)}
                  />
                </Field>
              )}
            </FormSection>
            <div className="form-actions">
              <Button variant="secondary" onClick={close} disabled={busy}>
                Cancelar
              </Button>
              <SaveButton
                busy={busy}
                label={editing ? "Guardar cambios" : "Registrar usuario"}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
