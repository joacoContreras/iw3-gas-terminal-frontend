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
