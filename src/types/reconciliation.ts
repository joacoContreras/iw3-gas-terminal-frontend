/**
 * LEGACY: tipo heredado contra la API vieja/imaginada.
 * Solo lo utiliza `src/services/mock/mockStore.ts` hasta su eliminación definitiva en la Fase 9 (D-7).
 * El código de producción de conciliación (Fase 7) utiliza exclusivamente `@/types/api` (`Reconciliation`, `Order`).
 */
export interface ReconciliationData {
  orderId: number;
  orderNumber: number;
  truckPatent: string;
  driverName: string;
  customerName: string;
  productName: string;

  // Scale weights
  initialWeight: number; // Tara (kg)
  finalWeight: number; // Bruto (kg)
  netByScale: number; // finalWeight - initialWeight (kg)

  // Meter loaded amount
  productLoadedByMeter: number; // Última masa acumulada del caudalímetro (kg)

  // Comparison & error
  differenceScaleVsMeter: number; // netByScale - productLoadedByMeter (kg)
  differencePercentage: number; // % difference

  // Averages from stored OrderDetail points
  averageTemperature: number; // °C
  averageDensity: number; // kg/m³
  averageFlowRate: number; // kg/h

  // Audit
  reconciledAt: string;
}
