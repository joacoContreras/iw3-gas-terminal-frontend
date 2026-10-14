import { Order } from "@/types/order";
import { Alarm, AlarmConfig } from "@/types/alarm";
import { ReconciliationData } from "@/types/reconciliation";
import { TelemetryPayload } from "@/types/telemetry";
import { calculateReconciliationMetrics } from "@/lib/calculations";

// Default initial state for local demo and offline testing
const INITIAL_ORDERS: Order[] = [
  {
    id: 101,
    orderNumber: 5001,
    externalCode: "SAP-ORD-2026-001",
    state: 2, // Con pesaje inicial registrado / en carga
    truck: {
      id: 1,
      patent: "AF-123-CD",
      description: "Scania R450 Cisterna Criogénica",
      cisterns: [
        { id: 1, cisternNumber: 1, capacity: 15000 },
        { id: 2, cisternNumber: 2, capacity: 15000 },
      ],
    },
    driver: {
      id: 1,
      name: "Carlos",
      lastName: "Méndez",
      document: "32.456.789",
    },
    customer: {
      id: 1,
      businessName: "YPF Gas S.A.",
      contact: "operaciones@ypf.com",
    },
    product: {
      id: 1,
      name: "Gas Licuado de Petróleo (GLP)",
      description: "Propano/Butano comercial grado comercial",
    },
    scheduledDate: new Date(Date.now() - 3600000).toISOString(),
    preset: 22000,
    initialWeight: 14500,
    initialWeightTime: new Date(Date.now() - 2400000).toISOString(),
    activationPassword: "74892",
    loadStartTime: new Date(Date.now() - 1200000).toISOString(),
    lastAccumulatedMass: 14850,
    lastDensity: 0.542,
    lastTemperature: 19.8,
    lastFlowRate: 12500,
    lastTelemetryTimestamp: new Date().toISOString(),
    receivedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 102,
    orderNumber: 5002,
    externalCode: "SAP-ORD-2026-002",
    state: 1, // Pendiente de pesaje inicial
    truck: {
      id: 2,
      patent: "AE-982-ZZ",
      description: "Volvo FH 500",
      cisterns: [{ id: 3, cisternNumber: 1, capacity: 25000 }],
    },
    driver: {
      id: 2,
      name: "Luciano",
      lastName: "Gómez",
      document: "29.871.223",
    },
    customer: {
      id: 2,
      businessName: "Shell Gas Argentina",
      contact: "logistica@shellgas.com.ar",
    },
    product: {
      id: 1,
      name: "Gas Licuado de Petróleo (GLP)",
      description: "Propano comercial",
    },
    scheduledDate: new Date().toISOString(),
    preset: 18000,
    receivedAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 103,
    orderNumber: 5003,
    externalCode: "SAP-ORD-2026-003",
    state: 3, // Cerrada para carga (esperando pesaje final)
    truck: {
      id: 3,
      patent: "AD-543-TY",
      description: "Mercedes-Benz Actros",
      cisterns: [
        { id: 4, cisternNumber: 1, capacity: 12000 },
        { id: 5, cisternNumber: 2, capacity: 8000 },
      ],
    },
    driver: {
      id: 3,
      name: "Esteban",
      lastName: "Ríos",
      document: "35.112.443",
    },
    customer: {
      id: 3,
      businessName: "Total Gas Distribuidora",
      contact: "contacto@totalgas.com",
    },
    product: {
      id: 1,
      name: "Gas Licuado de Petróleo (GLP)",
      description: "Butano puro",
    },
    scheduledDate: new Date(Date.now() - 7200000).toISOString(),
    preset: 16000,
    initialWeight: 13200,
    initialWeightTime: new Date(Date.now() - 5400000).toISOString(),
    activationPassword: "41935",
    loadStartTime: new Date(Date.now() - 4800000).toISOString(),
    loadEndTime: new Date(Date.now() - 1800000).toISOString(),
    lastAccumulatedMass: 16020,
    lastDensity: 0.538,
    lastTemperature: 21.2,
    lastFlowRate: 0,
    lastTelemetryTimestamp: new Date(Date.now() - 1800000).toISOString(),
    receivedAt: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: 104,
    orderNumber: 5004,
    externalCode: "SAP-ORD-2026-004",
    state: 4, // Finalizada y conciliada
    truck: {
      id: 4,
      patent: "AC-881-LL",
      description: "Scania G410",
      cisterns: [{ id: 6, cisternNumber: 1, capacity: 20000 }],
    },
    driver: {
      id: 4,
      name: "Marcelo",
      lastName: "Fernández",
      document: "27.491.002",
    },
    customer: {
      id: 1,
      businessName: "YPF Gas S.A.",
      contact: "operaciones@ypf.com",
    },
    product: {
      id: 1,
      name: "Gas Licuado de Petróleo (GLP)",
      description: "Propano comercial",
    },
    scheduledDate: new Date(Date.now() - 14400000).toISOString(),
    preset: 15000,
    initialWeight: 14100,
    initialWeightTime: new Date(Date.now() - 12000000).toISOString(),
    activationPassword: "82041",
    loadStartTime: new Date(Date.now() - 11000000).toISOString(),
    loadEndTime: new Date(Date.now() - 9000000).toISOString(),
    lastAccumulatedMass: 15040,
    lastDensity: 0.54,
    lastTemperature: 20.4,
    lastFlowRate: 0,
    lastTelemetryTimestamp: new Date(Date.now() - 9000000).toISOString(),
    finalWeight: 29190,
    finalWeightTime: new Date(Date.now() - 7200000).toISOString(),
    receivedAt: new Date(Date.now() - 18000000).toISOString(),
  },
];

const INITIAL_ALARMS: Alarm[] = [
  {
    id: 1,
    orderId: 101,
    orderNumber: 5001,
    temperature: 24.5,
    threshold: 22.0,
    triggeredAt: new Date(Date.now() - 600000).toISOString(),
    status: "PENDING",
  },
];

const ordersStore: Order[] = [...INITIAL_ORDERS];
const alarmsStore: Alarm[] = [...INITIAL_ALARMS];
let alarmConfigStore: AlarmConfig = {
  temperatureThreshold: 22.0,
  recipientEmails: ["seguridad@gas-terminal.com", "supervisor@gas-terminal.com"],
};

export const MockStore = {
  getOrders(): Order[] {
    return [...ordersStore];
  },

  getOrderById(id: number): Order | undefined {
    return ordersStore.find((o) => o.id === id || o.orderNumber === id);
  },

  createOrderFromSap(orderData: Partial<Order>): Order {
    const newId = Math.max(...ordersStore.map((o) => o.id), 100) + 1;
    const orderNumber =
      orderData.orderNumber ||
      Math.max(...ordersStore.map((o) => o.orderNumber), 5000) + 1;

    const newOrder: Order = {
      id: newId,
      orderNumber,
      externalCode: orderData.externalCode || `SAP-ORD-${orderNumber}`,
      state: 1,
      truck: orderData.truck || {
        patent: "AA-000-XX",
        description: "Camión Cisterna",
        cisterns: [{ cisternNumber: 1, capacity: 20000 }],
      },
      driver: orderData.driver || {
        name: "Conductor",
        lastName: "Designado",
      },
      customer: orderData.customer || {
        businessName: "Cliente Estándar S.A.",
      },
      product: orderData.product || {
        name: "Gas Licuado (GLP)",
      },
      scheduledDate: orderData.scheduledDate || new Date().toISOString(),
      preset: orderData.preset || 15000,
      receivedAt: new Date().toISOString(),
    };

    ordersStore.unshift(newOrder);
    return newOrder;
  },

  registerInitialWeight(orderId: number, initialWeight: number): Order {
    const order = this.getOrderById(orderId);
    if (!order) throw new Error("Orden no encontrada");
    if (order.state !== 1) {
      throw new Error("La orden no está en Estado 1 (Pendiente de pesaje inicial)");
    }

    const pin = Math.floor(10000 + Math.random() * 90000).toString();
    order.state = 2;
    order.initialWeight = initialWeight;
    order.initialWeightTime = new Date().toISOString();
    order.activationPassword = pin;
    return { ...order };
  },

  activateLoadWithPassword(orderCode: string | number, password: string): { preset: number } {
    const order = ordersStore.find(
      (o) => o.orderNumber === Number(orderCode) || o.externalCode === String(orderCode)
    );
    if (!order) throw new Error("Orden no encontrada");
    if (order.state !== 2) {
      throw new Error("La orden no se encuentra en Estado 2");
    }
    if (order.activationPassword !== password) {
      throw new Error("Contraseña de activación incorrecta");
    }
    if (!order.loadStartTime) {
      order.loadStartTime = new Date().toISOString();
    }
    return { preset: order.preset };
  },

  receiveTelemetry(orderId: number, data: TelemetryPayload): Order {
    const order = this.getOrderById(orderId);
    if (!order) throw new Error("Orden no encontrada");
    if (order.state !== 2) {
      throw new Error("Solo se puede recibir telemetría para órdenes en Estado 2");
    }

    // Rules from spec: discard if caudal <= 0 or masa <= 0 or masa < last
    if (data.flowRate <= 0) {
      throw new Error("Caudal inválido: debe ser mayor a 0");
    }
    if (data.accumulatedMass <= 0) {
      throw new Error("Masa acumulada inválida: debe ser mayor a 0");
    }
    if (
      order.lastAccumulatedMass !== undefined &&
      data.accumulatedMass < order.lastAccumulatedMass
    ) {
      throw new Error("Masa acumulada decreciente descartada");
    }

    if (!order.loadStartTime) {
      order.loadStartTime = new Date().toISOString();
    }

    order.lastAccumulatedMass = data.accumulatedMass;
    order.lastDensity = data.density;
    order.lastTemperature = data.temperature;
    order.lastFlowRate = data.flowRate;
    order.lastTelemetryTimestamp = new Date().toISOString();

    // Check alarm condition
    if (data.temperature > alarmConfigStore.temperatureThreshold) {
      const activeAlarm = alarmsStore.find(
        (a) => a.orderId === order.id && a.status === "PENDING"
      );
      if (!activeAlarm) {
        alarmsStore.unshift({
          id: alarmsStore.length + 1,
          orderId: order.id,
          orderNumber: order.orderNumber,
          temperature: data.temperature,
          threshold: alarmConfigStore.temperatureThreshold,
          triggeredAt: new Date().toISOString(),
          status: "PENDING",
        });
      }
    }

    return { ...order };
  },

  closeOrder(orderId: number): Order {
    const order = this.getOrderById(orderId);
    if (!order) throw new Error("Orden no encontrada");
    if (order.state !== 2) {
      throw new Error("Solo una orden en Estado 2 puede cerrarse para carga");
    }
    order.state = 3;
    order.loadEndTime = new Date().toISOString();
    order.lastFlowRate = 0;
    return { ...order };
  },

  registerFinalWeight(orderId: number, finalWeight: number): ReconciliationData {
    const order = this.getOrderById(orderId);
    if (!order) throw new Error("Orden no encontrada");
    if (order.state !== 3) {
      throw new Error("La orden debe estar en Estado 3 (Cerrada para carga) para registrar pesaje final");
    }

    order.state = 4;
    order.finalWeight = finalWeight;
    order.finalWeightTime = new Date().toISOString();

    return this.getReconciliation(order.id);
  },

  getReconciliation(orderId: number): ReconciliationData {
    const order = this.getOrderById(orderId);
    if (!order) throw new Error("Orden no encontrada");
    if (order.state !== 4) {
      throw new Error("La conciliación solo está disponible para órdenes en Estado 4 (Finalizadas)");
    }

    const initial = order.initialWeight || 0;
    const finalW = order.finalWeight || 0;
    const loaded = order.lastAccumulatedMass || 0;
    const metrics = calculateReconciliationMetrics(initial, finalW, loaded);

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      truckPatent: order.truck.patent,
      driverName: `${order.driver.name} ${order.driver.lastName}`,
      customerName: order.customer.businessName,
      productName: order.product.name,
      initialWeight: initial,
      finalWeight: finalW,
      netByScale: metrics.netByScale,
      productLoadedByMeter: metrics.productLoadedByMeter,
      differenceScaleVsMeter: metrics.differenceScaleVsMeter,
      differencePercentage: metrics.differencePercentage,
      averageTemperature: order.lastTemperature || 20.0,
      averageDensity: order.lastDensity || 0.54,
      averageFlowRate: 11800,
      reconciledAt: order.finalWeightTime || new Date().toISOString(),
    };
  },

  getAlarms(): Alarm[] {
    return [...alarmsStore];
  },

  acknowledgeAlarm(alarmId: number, username: string, observation?: string): Alarm {
    const alarm = alarmsStore.find((a) => a.id === alarmId);
    if (!alarm) throw new Error("Alarma no encontrada");
    alarm.status = "ACKNOWLEDGED";
    alarm.acknowledgedBy = username;
    alarm.acknowledgedAt = new Date().toISOString();
    alarm.observation = observation;
    return { ...alarm };
  },

  getAlarmConfig(): AlarmConfig {
    return { ...alarmConfigStore };
  },

  updateAlarmConfig(newConfig: Partial<AlarmConfig>): AlarmConfig {
    alarmConfigStore = {
      ...alarmConfigStore,
      ...newConfig,
    };
    return { ...alarmConfigStore };
  },
};
