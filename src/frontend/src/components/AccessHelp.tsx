import React from "react";
import { Modal, Button, Alert } from "./Ui";
import { useResource } from "../lib/useResource";
import api from "../services/api";
import Icon from "./Icon";
export default function AccessHelp({ close }: { close: () => void }) {
  const contacts = useResource(
    async () =>
      (
        await api.get<{ nombre: string; correo: string; area: string }[]>(
          "/auth/support-contacts",
        )
      ).data,
  );
  return (
    <Modal
      title="Te ayudamos a ingresar"
      description="Cuentas y recuperación · Administración de TechAsset"
      close={close}
    >
      <div className="help-content">
        <div className="help-route">
          <span>01</span>
          <div>
            <h3>Solicita tu cuenta o un restablecimiento</h3>
            <p>
              Escribe a uno de los administradores activos que figuran debajo.
              Indica tu nombre, correo institucional, área y si necesitas una
              cuenta o recuperar el acceso. Tu responsable de área debe
              confirmar el rol solicitado.
            </p>
          </div>
        </div>
        <Alert
          message={contacts.error}
          action={<Button onClick={contacts.reload}>Reintentar</Button>}
        />
        {contacts.loading && <p role="status">Consultando responsables…</p>}
        {contacts.data?.map((c) => (
          <a
            className="support-contact"
            key={c.correo}
            href={`mailto:${c.correo}?subject=${encodeURIComponent("TechAsset · Ayuda de acceso")}`}
          >
            <span className="support-contact-icon">
              <Icon name="mail" />
            </span>
            <span>
              <strong>{c.nombre}</strong>
              <small>Administrador · {c.area}</small>
              <span>{c.correo}</span>
            </span>
            <Icon name="arrow" size={17} />
          </a>
        ))}
        {contacts.data?.length === 0 && (
          <p>
            No hay administradores activos disponibles en el directorio.
            Comunícate con el responsable de Tecnología de tu organización para
            habilitar un administrador.
          </p>
        )}
        <p className="field-hint">
          El enlace abre tu aplicación de correo. TechAsset no envía el mensaje
          automáticamente. Nunca envíes tu contraseña.
        </p>
        <div className="help-route">
          <span>02</span>
          <div>
            <h3>Recibe un acceso temporal</h3>
            <p>
              El administrador crea o restablece tu contraseña y te la comunica
              por un canal privado. Al ingresar, debes reemplazarla por una
              contraseña personal segura.
            </p>
          </div>
        </div>
        <div className="help-route">
          <span>03</span>
          <div>
            <h3>Continúa al espacio de tu rol</h3>
            <ul>
              <li>
                <strong>Colaborador → Inventario:</strong> disponibilidad,
                solicitudes y tus préstamos.
              </li>
              <li>
                <strong>Tecnología → Panel:</strong> equipos, aprobaciones y
                devoluciones.
              </li>
              <li>
                <strong>Administrador → Panel:</strong> operación general,
                usuarios y permisos.
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="form-actions">
        <Button onClick={close}>Volver al ingreso</Button>
      </div>
    </Modal>
  );
}
