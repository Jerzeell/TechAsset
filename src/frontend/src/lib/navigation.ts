import { User, staff } from "./models";
export type NavigationItem = {
  path: string;
  label: string;
  group: string;
  icon: string;
  description: string;
  staff?: boolean;
  admin?: boolean;
};
export const navigation: NavigationItem[] = [
  {
    path: "/panel",
    label: "Resumen",
    group: "General",
    icon: "dashboard",
    description: "Indicadores, prioridades y actividad reciente",
    staff: true,
  },
  {
    path: "/equipos",
    label: "Inventario",
    group: "Operaciones",
    icon: "equipment",
    description: "Consultar y gestionar equipos tecnológicos",
  },
  {
    path: "/prestamos",
    label: "Préstamos",
    group: "Operaciones",
    icon: "loans",
    description: "Asignaciones, devoluciones e historial",
  },
  {
    path: "/solicitudes",
    label: "Solicitudes",
    group: "Operaciones",
    icon: "requests",
    description: "Solicitar equipos y revisar aprobaciones",
  },
  {
    path: "/movimientos",
    label: "Movimientos",
    group: "Administración",
    icon: "history",
    description: "Trazabilidad de las operaciones del sistema",
    staff: true,
  },
  {
    path: "/usuarios",
    label: "Usuarios",
    group: "Administración",
    icon: "users",
    description: "Perfiles, áreas y permisos de acceso",
    admin: true,
  },
];
export function allowedNavigation(user: User | null) {
  return navigation.filter(
    (x) =>
      (!x.staff || staff(user)) && (!x.admin || user?.rol === "Administrador"),
  );
}
