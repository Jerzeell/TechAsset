import axios from "axios";

// Vite environments can read VITE_API_URL.
// When running locally on host, API will be on http://localhost:5001.
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to append JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("techasset_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to catch 401 Unauthorized status codes
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("techasset_token");
      localStorage.removeItem("techasset_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login?motivo=sesion";
      }
    }
    const data = error.response?.data;
    if (
      data?.code === "PASSWORD_CHANGE_REQUIRED" &&
      window.location.pathname !== "/cambiar-contrasena"
    ) {
      const user = JSON.parse(localStorage.getItem("techasset_user") || "null");
      if (user)
        localStorage.setItem(
          "techasset_user",
          JSON.stringify({ ...user, mustChangePassword: true }),
        );
      window.location.href = "/cambiar-contrasena";
    }
    error.message =
      data?.message ||
      (data?.errors
        ? Object.values(data.errors).flat().join(" ")
        : error.response?.status === 403
          ? "No tiene permisos para esta acción."
          : !error.response
            ? "No se puede conectar con el servidor. Comprueba la conexión y vuelve a intentar."
            : error.response.status >= 500
              ? "No se pudo completar la operación. Tus datos siguen en el formulario; vuelve a intentar."
              : error.message);
    return Promise.reject(error);
  },
);

export default api;
