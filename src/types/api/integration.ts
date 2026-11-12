import type { LocalDateTime } from "./common";

/**
 * Cuerpos de los endpoints de integración (SAP, balanza TMS y sistema de carga). Los llaman los sistemas
 * externos y el simulador del frontend (rol ADMIN). Contrato en docs/contrato-api.md, sección 5.
 */

/** `POST /integration/sap/orders` (Punto 1): las cuatro entidades se sincronizan por `externalCode`. */
export interface SapOrderRequest {
  orderNumber: number;
  plannedLoadDateTime: LocalDateTime;
  /** Obligatorio: sin él el backend responde 400 (formato de Spring, sin `message`). */
  preset: number;
  truck: {
    externalCode: string;
    plate: string;
    description?: string;
    tanks: { number: number; capacityLiters: number }[];
  };
  driver: { externalCode: string; name: string; lastName: string; document?: string };
  customer: { externalCode: string; companyName: string; contact?: string };
  product: { externalCode: string; name: string; description?: string };
}

/** `POST /integration/tms/orders/{n}/tare` y `.../final-weight`: peso en kg. */
export interface WeightRequest {
  weight: number;
}

/** Respuesta de la tara: único lugar donde aparece la contraseña de activación (5 dígitos). */
export interface TareResponse {
  activationPassword: number;
}

/** `POST /integration/loader/activation` (Punto 3). 403 si la contraseña es incorrecta. */
export interface ActivationRequest {
  orderNumber: number;
  password: number;
}

export interface ActivationResponse {
  /** Kilogramos a cargar. */
  preset: number;
}

/** `POST /integration/loader/orders/{n}/details`: una lectura del caudalímetro. */
export interface ReadingRequest {
  accumulatedMass: number;
  /** Entre 0 y 1, sin incluirlos. */
  density: number;
  temperature: number;
  /** kg/h; mayor que 0. */
  flowRate: number;
}

/** Siempre HTTP 200: una lectura inválida se descarta (`saved: false`) con su motivo. */
export interface ReadingResponse {
  saved: boolean;
  reason: string | null;
}
