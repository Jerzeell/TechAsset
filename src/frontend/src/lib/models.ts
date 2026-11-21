import { IS_DEMO, demoUser } from './demo';
export type User = {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  area: string;
  rol: string;
  estado: boolean;
  mustChangePassword: boolean;
  passwordChangedAt: string | null;
};
export type Equipment = {
  id: string;
  codigoPatrimonial: string;
  nombre: string;
  categoria: string;
  marca: string;
  estado: string;
};
export type Loan = {
  id: string;
  fechaPrestamo: string;
  fechaDevolucion: string | null;
  observacion: string | null;
  observacionDevolucion: string | null;
  usuarioId: string;
  usuarioNombre: string;
  usuarioCorreo: string;
  equipoId: string;
  equipoNombre: string;
  equipoCodigoPatrimonial: string;
  areaPrestamo: string;
  responsableId: string;
};
export type LoanRequest = {
  id: string;
  usuarioId: string;
  equipoId: string;
  motivo: string;
  estado: string;
  fechaSolicitud: string;
  usuarioNombre: string;
  equipoNombre: string;
};
export type Movement = {
  id: string;
  fecha: string;
  entidad: string;
  entidadId: string;
  accion: string;
  detalle: string;
  responsable: string;
};
export const categories = [
  "Laptops",
  "Computadoras de escritorio",
  "Monitores",
  "Impresoras",
  "Tablets",
  "Proyectores multimedia",
  "Equipos de red",
];
export const equipmentStates = [
  "Disponible",
  "Prestado",
  "Mantenimiento",
  "Baja",
];
export const roleLabel = (role: string) =>
  role === "ResponsableTecnologia" ? "Responsable de Tecnología" : role;
export function getUser(): User | null {
  if (IS_DEMO) return demoUser();
  try {
    return JSON.parse(localStorage.getItem("techasset_user") || "null");
  } catch {
    return null;
  }
}
export const staff = (user: User | null) =>
  user?.rol === "Administrador" || user?.rol === "ResponsableTecnologia";
export const fullName = (user: User) => `${user.nombres} ${user.apellidos}`;
export function formatDate(value: string | null, time = false) {
  return value
    ? new Intl.DateTimeFormat("es-PE", {
        timeZone: "America/Lima",
        day: "2-digit",
        month: "short",
        year: "numeric",
        ...(time ? { hour: "2-digit", minute: "2-digit" } : {}),
      }).format(new Date(value))
    : "Sin devolución";
}
export function localDateTime(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 19);
}
export function dayInPeru(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
export function downloadCsv(
  name: string,
  headers: string[],
  rows: unknown[][],
) {
  const cell = (value: unknown) => {
    let s = String(value ?? "");
    if (/^[=+@\-\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  };
  const blob = new Blob(
    [
      "\ufeff" +
        [headers, ...rows].map((row) => row.map(cell).join(";")).join("\r\n"),
    ],
    { type: "text/csv;charset=utf-8;" },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name + ".csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
