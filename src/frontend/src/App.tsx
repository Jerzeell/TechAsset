import React, { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Layout from "./components/Layout";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import LoginPage from "./pages/LoginPage";
import PortalPage from "./pages/PortalPage";
import DashboardPage from "./pages/DashboardPage";
import EquipmentPage from "./pages/EquipmentPage";
import LoansPage from "./pages/LoansPage";
import UsersPage from "./pages/UsersPage";
import MovementsPage from "./pages/MovementsPage";
import UiProvider from "./components/UiProvider";
import { getSessionUser, isSessionExpired } from "./lib/session";
function PrivateArea() {
  const user = getSessionUser(),
    navigate = useNavigate(),
    location = useLocation();
  useEffect(() => {
    const validate = () => {
      if (isSessionExpired()) {
        localStorage.removeItem("techasset_token");
        localStorage.removeItem("techasset_user");
        navigate("/login?motivo=sesion", { replace: true });
      }
    };
    const timer = setInterval(validate, 30000);
    const sync = (e: StorageEvent) => {
      if (e.key === "techasset_token") validate();
    };
    window.addEventListener("storage", sync);
    return () => {
      clearInterval(timer);
      window.removeEventListener("storage", sync);
    };
  }, [navigate]);
  if (!user || isSessionExpired())
    return (
      <Navigate
        to={"/login" + (user ? "?motivo=sesion" : "")}
        state={{ from: location.pathname }}
        replace
      />
    );
  if (user.mustChangePassword && location.pathname !== "/cambiar-contrasena")
    return <Navigate to="/cambiar-contrasena" replace />;
  return <Outlet />;
}
function StaffArea() {
  return getSessionUser()?.rol === "Colaborador" ? (
    <Navigate to="/equipos" replace />
  ) : (
    <Outlet />
  );
}
function AdminArea() {
  return getSessionUser()?.rol === "Administrador" ? (
    <Outlet />
  ) : (
    <Navigate to="/equipos" replace />
  );
}
export default function App() {
  return (
    <UiProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PortalPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route element={<PrivateArea />}>
            <Route
              path="/cambiar-contrasena"
              element={<ChangePasswordPage />}
            />
            <Route element={<Layout />}>
              <Route path="/equipos" element={<EquipmentPage />} />
              <Route path="/prestamos" element={<LoansPage />} />
              <Route
                path="/solicitudes"
                element={<LoansPage view="requests" />}
              />
              <Route element={<StaffArea />}>
                <Route path="/panel" element={<DashboardPage />} />
                <Route path="/movimientos" element={<MovementsPage />} />
              </Route>
              <Route element={<AdminArea />}>
                <Route path="/usuarios" element={<UsersPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </UiProvider>
  );
}
