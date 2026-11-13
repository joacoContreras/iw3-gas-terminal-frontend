/**
 * Reglas de validación para la gestión de alarmas (Fase 8).
 * Contrato en docs/contrato-api.md (sección 3.1: PUT /alarms/config y POST /alarms/{id}/acknowledge).
 */

export const MAX_RECIPIENT_EMAILS = 20;
export const MAX_OBSERVATION_LENGTH = 500;

// Expresión regular estándar para validación sintáctica de correos electrónicos
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  if (trimmed.length > 254) return false;
  return EMAIL_REGEX.test(trimmed);
}

export function validateThreshold(threshold: unknown): { valid: boolean; error?: string } {
  if (threshold === undefined || threshold === null || threshold === "") {
    return { valid: false, error: "El umbral de temperatura es obligatorio." };
  }
  const num = Number(threshold);
  if (!Number.isFinite(num)) {
    return { valid: false, error: "El umbral de temperatura debe ser un número finito." };
  }
  if (num < -100 || num > 200) {
    return { valid: false, error: "El umbral de temperatura debe encontrarse entre -100 °C y 200 °C." };
  }
  return { valid: true };
}

export function validateRecipientEmails(emails: string[]): {
  valid: boolean;
  error?: string;
  sanitized?: string[];
} {
  if (!Array.isArray(emails)) {
    return { valid: false, error: "La lista de destinatarios debe ser una lista." };
  }
  if (emails.length > MAX_RECIPIENT_EMAILS) {
    return { valid: false, error: `No se pueden configurar más de ${MAX_RECIPIENT_EMAILS} destinatarios.` };
  }

  const seen = new Set<string>();
  const sanitized: string[] = [];

  for (const raw of emails) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (!isValidEmail(trimmed)) {
      return { valid: false, error: `El correo «${trimmed}» no tiene un formato válido.` };
    }
    const lower = trimmed.toLowerCase();
    if (seen.has(lower)) {
      return { valid: false, error: `El correo «${trimmed}» está repetido en la lista.` };
    }
    seen.add(lower);
    sanitized.push(trimmed);
  }

  return { valid: true, sanitized };
}

export function validateObservation(obs?: string | null): { valid: boolean; error?: string } {
  if (!obs) return { valid: true };
  if (obs.length > MAX_OBSERVATION_LENGTH) {
    return {
      valid: false,
      error: `La observación no puede superar los ${MAX_OBSERVATION_LENGTH} caracteres (actual: ${obs.length}).`,
    };
  }
  return { valid: true };
}
