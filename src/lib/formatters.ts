export function formatKg(val?: number): string {
  if (val === undefined || val === null || isNaN(val)) return "0 kg";
  return `${new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 1,
  }).format(val)} kg`;
}

export function formatTemperature(val?: number): string {
  if (val === undefined || val === null || isNaN(val)) return "-- °C";
  return `${new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(val)} °C`;
}

export function formatDensity(val?: number): string {
  if (val === undefined || val === null || isNaN(val)) return "-- kg/m³";
  return `${new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 4,
  }).format(val)} kg/m³`;
}

export function formatFlowRate(val?: number): string {
  if (val === undefined || val === null || isNaN(val)) return "0 kg/h";
  return `${new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 1,
  }).format(val)} kg/h`;
}

export function formatDateTime(isoDate?: string): string {
  if (!isoDate) return "--";
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    return new Intl.DateTimeFormat("es-AR", {
      dateStyle: "short",
      timeStyle: "medium",
    }).format(d);
  } catch {
    return isoDate;
  }
}

export function formatDuration(minutes: number | null): string {
  if (minutes === null) return "--";
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}
