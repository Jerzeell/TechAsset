import { User } from "./models";
export function getSessionUser(): User | null {
  try {
    const user = JSON.parse(localStorage.getItem("techasset_user") || "null");
    if (!user?.id || !user?.rol || !localStorage.getItem("techasset_token"))
      return null;
    return user;
  } catch {
    return null;
  }
}
export function isSessionExpired() {
  try {
    const token = localStorage.getItem("techasset_token");
    if (!token) return true;
    const data = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    return !data.exp || data.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}
export function roleLabel(role: string) {
  return role === "ResponsableTecnologia" ? "Responsable de Tecnología" : role;
}
