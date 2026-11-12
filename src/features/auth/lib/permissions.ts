/**
 * Qué puede hacer cada rol en la interfaz. Es un espejo de la matriz de roles del backend
 * (`docs/contrato-api.md`, sección 3): la interfaz oculta lo que el rol no permite, pero **la API siempre decide**
 * (responde 403). `permissions.test.mjs` compara esta tabla con el contrato para que no se desincronicen.
 *
 * Este módulo no tiene imports en tiempo de ejecución a propósito: así lo prueba `npm test` con el ejecutor de Node.
 */

/** Nombre corto del rol, como figura en la columna «Roles» del contrato (en el token lleva el prefijo `ROLE_`). */
export type RoleName = "ADMIN" | "SUPERVISOR" | "OPERADOR" | "SAP" | "TMS" | "LOADER" | "USER";

export const ROLE_NAMES: readonly RoleName[] = ["ADMIN", "SUPERVISOR", "OPERADOR", "SAP", "TMS", "LOADER", "USER"];

/** Etiquetas para mostrar el rol en la barra superior. */
export const ROLE_LABELS: Record<RoleName, string> = {
  ADMIN: "Administrador",
  SUPERVISOR: "Supervisor",
  OPERADOR: "Operador",
  SAP: "Sistema SAP",
  TMS: "Sistema de balanza (TMS)",
  LOADER: "Sistema de carga",
  USER: "Usuario",
};

export type Permission =
  | "orders:view"
  | "orders:close"
  | "alarms:view"
  | "alarms:acknowledge"
  | "alarms:config:view"
  | "alarms:config:edit"
  | "simulator:use";

/**
 * Cada permiso apunta a los endpoints del contrato que lo respaldan; los roles permitidos son los que figuran en
 * **todos** ellos (por eso el simulador, que llama a SAP, TMS y carga, es solo ADMIN).
 */
export const PERMISSIONS: Record<Permission, { endpoints: string[]; roles: RoleName[] }> = {
  "orders:view": { endpoints: ["GET /orders", "GET /orders/{orderNumber}"], roles: ["ADMIN", "SUPERVISOR", "OPERADOR"] },
  "orders:close": { endpoints: ["POST /integration/loader/orders/{orderNumber}/close"], roles: ["ADMIN", "SUPERVISOR", "OPERADOR", "LOADER"] },
  "alarms:view": { endpoints: ["GET /alarms"], roles: ["ADMIN", "SUPERVISOR", "OPERADOR"] },
  "alarms:acknowledge": { endpoints: ["POST /alarms/{id}/acknowledge"], roles: ["ADMIN", "SUPERVISOR"] },
  "alarms:config:view": { endpoints: ["GET /alarms/config"], roles: ["ADMIN", "SUPERVISOR"] },
  "alarms:config:edit": { endpoints: ["PUT /alarms/config"], roles: ["ADMIN"] },
  "simulator:use": {
    endpoints: [
      "POST /integration/sap/orders",
      "POST /integration/tms/orders/{orderNumber}/tare",
      "POST /integration/loader/activation",
      "POST /integration/loader/orders/{orderNumber}/details",
      "POST /integration/tms/orders/{orderNumber}/final-weight",
    ],
    roles: ["ADMIN"],
  },
};

/** `ROLE_ADMIN` → `ADMIN` (acepta también el nombre corto). */
export function normalizeRole(role: string): string {
  return role.startsWith("ROLE_") ? role.slice("ROLE_".length) : role;
}

/** ¿Alguno de los roles del usuario está entre los pedidos? Acepta nombres con o sin `ROLE_`. */
export function hasAnyRole(userRoles: readonly string[], required: readonly string[]): boolean {
  const wanted = new Set(required.map(normalizeRole));
  return userRoles.some((r) => wanted.has(normalizeRole(r)));
}

/** ¿El usuario (por sus roles) tiene el permiso? Sin roles no hay permisos. */
export function can(userRoles: readonly string[], permission: Permission): boolean {
  return hasAnyRole(userRoles, PERMISSIONS[permission].roles);
}

/** Rol principal para mostrar: el de mayor jerarquía entre los del usuario (ADMIN > SUPERVISOR > OPERADOR > sistemas > USER). */
export function primaryRole(userRoles: readonly string[]): RoleName | null {
  const have = new Set(userRoles.map(normalizeRole));
  return ROLE_NAMES.find((r) => have.has(r)) ?? null;
}
