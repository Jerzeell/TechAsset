import React from "react";
import Icon from "./Icon";
const types: Record<string, { label: string; tone: string; icon: string }> = {
  Added: { label: "Registro", tone: "green", icon: "plus" },
  Modified: { label: "Actualización", tone: "amber", icon: "refresh" },
  Deleted: { label: "Eliminación", tone: "red", icon: "trash" },
};
export const movementActionLabel = (action: string) => types[action]?.label || action;
export default function MovementAction({ action }: { action: string }) {
  const type = types[action] || { label: action, tone: "blue", icon: "history" };
  return <span className={`movement-action movement-action-${type.tone}`}>
    <Icon name={type.icon} size={14} />{type.label}
  </span>;
}
