# Fase 7 — Conciliación (consigna 4f)

**Rama:** `fase-7-conciliacion` (desde `main`, `0181d97`) · **Fecha:** 13/11/2026 · **Estado:** integrada en `main` (PR #7) y desplegada  
**Objetivo:** que la pantalla de conciliación (`/orders/[orderNumber]/reconciliation`) consuma los datos reales del backend (`GET /orders/{orderNumber}/reconciliation`), combinados con los datos de la orden (`GET /orders/{orderNumber}`) para generar el remito oficial imprimible, calcule de forma segura el porcentaje de desvío y restrinja el acceso a órdenes en estado 4 manejando el error HTTP 409.

---

## 1. Qué se hizo

| Tarea del plan | Resultado |
|---|---|
| **T1 · `reconciliationApi` real** | `src/features/reconciliation/services/reconciliationApi.ts`: consume directamente `GET /orders/{orderNumber}/reconciliation` con `apiClient<Reconciliation>`. Se eliminó completamente `MockStore` y cualquier fallback a datos falsos. En `useReconciliation` se combina en paralelo con `ordersApi.getOrder` para completar los datos del remito (cliente, chofer, patente, producto y fecha de pesaje final). |
| **T2 · Métricas y porcentaje derivado** | Se muestran tara, pesaje final, producto cargado, neto por balanza y diferencia directa. En `src/lib/calculations.ts` se implementó `calculateDifferencePercentage(difference, scaleNet)` (`(difference / scaleNet) * 100`) con validación ante `scaleNet <= 0` o valores no finitos. La UI lo rotula explícitamente como cálculo derivado. |
| **T3 · Acceso exclusivo en estado 4** | El botón de acceso en el detalle de orden solo se muestra si `status === 4`. Si se accede por URL directa a una orden en estado 1, 2 o 3, el backend responde HTTP 409: la UI captura el código, muestra el mensaje oficial del backend, el estado actual de la orden y botones claros para volver al detalle o al listado. |
| **T4 · Caso de borde: orden sin lecturas** | Si una orden finalizó sin lecturas de caudalímetro (`loadedProduct = 0` y promedios en `null`), la UI no muestra `0 °C` engañoso ni `NaN`: informa «0 kg (sin lecturas)» y «Sin datos» en los promedios de telemetría. |
| **T5 · Remito imprimible, tests y docs** | [reconciliation-ticket.tsx](file:///home/joa/repos/iw3-gas-terminal-frontend/src/features/reconciliation/components/reconciliation-ticket.tsx) actualizado con tipado real y estilos aptos para impresión nativa (`window.print()`). 12 tests unitarios añadidos en [calculations.test.mjs](file:///home/joa/repos/iw3-gas-terminal-frontend/src/lib/calculations.test.mjs) (139 tests totales pasando). Este informe y guía de defensa. |

### Archivos tocados

| Archivo | Motivo |
|---|---|
| [reconciliationApi.ts](file:///home/joa/repos/iw3-gas-terminal-frontend/src/features/reconciliation/services/reconciliationApi.ts) | Cliente HTTP real hacia `GET /orders/{orderNumber}/reconciliation` con tipos de `@/types/api`. Cero mocks. |
| [useReconciliation.ts](file:///home/joa/repos/iw3-gas-terminal-frontend/src/features/reconciliation/hooks/useReconciliation.ts) | Hook que obtiene en paralelo la conciliación y la orden, calcula las métricas derivadas y captura estados de error (403, 404, 409). Se eliminaron los `any`. |
| [reconciliation-summary.tsx](file:///home/joa/repos/iw3-gas-terminal-frontend/src/features/reconciliation/components/reconciliation-summary.tsx) | Tarjetas de balanza, caudalímetro y diferencia neta con porcentaje derivado y aviso de tolerancia (±1.0%). |
| [reconciliation-metrics.tsx](file:///home/joa/repos/iw3-gas-terminal-frontend/src/features/reconciliation/components/reconciliation-metrics.tsx) | Promedios de telemetría (temperatura, densidad, caudal) que soportan `null` sin mostrar valores falsos. |
| [reconciliation-ticket.tsx](file:///home/joa/repos/iw3-gas-terminal-frontend/src/features/reconciliation/components/reconciliation-ticket.tsx) | Remito oficial imprimible con datos reales del transporte, cliente, producto y tabla de conciliación. |
| [page.tsx](file:///home/joa/repos/iw3-gas-terminal-frontend/src/app/(dashboard)/orders/[orderNumber]/reconciliation/page.tsx) | Pantalla de conciliación bajo Next.js 16 (resolución de `params` con `React.use`), estados de carga, manejo de 409, 403 y 404. |
| [calculations.ts](file:///home/joa/repos/iw3-gas-terminal-frontend/src/lib/calculations.ts) | Funciones de porcentaje de desvío y tolerancia, protegiendo división por cero. |
| [calculations.test.mjs](file:///home/joa/repos/iw3-gas-terminal-frontend/src/lib/calculations.test.mjs) | 12 pruebas unitarias de casos normales, casos límite y compatibilidad. |
| [reconciliation.ts](file:///home/joa/repos/iw3-gas-terminal-frontend/src/types/reconciliation.ts) | Marcado como tipo legacy保留 para `mockStore.ts` hasta la Fase 9. |

---

## 2. Decisiones de diseño

- **F7-1 · Combinar orden y conciliación en el frontend:** El endpoint de conciliación del backend (`GET /orders/{orderNumber}/reconciliation`) es puramente numérico (pesos, masa y promedios). Para emitir el remito oficial con el cliente, el chofer, la patente y la fecha del pesaje final, el hook `useReconciliation` combina en paralelo la llamada a `/reconciliation` y `/orders/{orderNumber}`.
- **F7-2 · Porcentaje derivado seguro:** El backend calcula `difference = scaleNet - loadedProduct`, pero no calcula el porcentaje para no acoplarse a reglas de redondeo de la UI. El frontend calcula `(difference / scaleNet) * 100`. Si `scaleNet <= 0`, devuelve `null` en lugar de `Infinity` o `NaN`.
- **F7-3 · Distinguir «sin lecturas» de «cero»:** Si una orden finalizó sin que el caudalímetro enviara lecturas válidas, `loadedProduct` es `0.0` y los promedios son `null`. La UI muestra explícitamente «Sin datos» en lugar de `0 °C` o `0 kg/h`, lo que daría la falsa impresión de que se midió frío extremo o caudal nulo.
- **F7-4 · Manejo explícito de HTTP 409:** Si el usuario ingresa manualmente a la URL `/orders/123/reconciliation` de una orden en estado 1, 2 o 3, el backend rechaza la operación con 409. La pantalla no muestra un error genérico: captura el estado, explica por qué no se puede conciliar todavía y ofrece un botón directo para volver al detalle de la orden.
- **F7-5 · Tolerancia estándar ±1.0%:** La terminal de gas clasifica el desvío dentro de tolerancia aceptable si el desvío porcentual absoluto es `<= 1.0%`, marcando claramente en verde o amarillo el estado de la conciliación.

---

## 3. Recorrido de los datos

1. El usuario navega a `/orders/652444947/reconciliation` (o hace clic en «Ver conciliación final» desde el detalle de una orden en estado 4).
2. `OrderReconciliationPage` resuelve `params` como `Promise` con `React.use` y valida que `orderNumber` sea numérico.
3. `useReconciliation` dispara en paralelo:
   - `GET /orders/652444947/reconciliation`
   - `GET /orders/652444947`
4. Si la orden está en estado 4:
   - Llega el JSON de conciliación (`tare`, `finalWeight`, `loadedProduct`, `scaleNet`, `difference`, promedios).
   - Se calcula el porcentaje derivado: `(difference / scaleNet) * 100`.
   - Se renderizan:
     - `ReconciliationSummary`: tarjetas de balanza (tara, bruto, neto), caudalímetro (producto cargado) y diferencia balanza vs. caudalímetro.
     - `ReconciliationMetrics`: promedios de temperatura, densidad y caudal.
     - `ReconciliationTicket`: remito oficial listo para imprimir con firmas, datos de camión y cliente.
5. Si la orden no estuviese en estado 4:
   - `GET .../reconciliation` responde `409 Conflict`.
   - `apiClient` lanza `ApiError(409, message)`.
   - La pantalla muestra el callout amigable indicando que la conciliación requiere pesaje final registrado, con enlace al detalle.

---

## 4. Pruebas ejecutadas

| Prueba | Comando | Resultado |
|---|---|---|
| **Pruebas unitarias** | `npm test` | **139 tests pasando, 0 fallas** (12 tests nuevos en `calculations.test.mjs`, incluyendo cálculo manual, ejemplo del contrato y división por cero). |
| **Chequeo de tipos** | `npx tsc --noEmit` | **0 errores** de TypeScript. |
| **Linter** | `npm run lint` | **0 errores, 7 advertencias** (se eliminó la advertencia `any` de `useReconciliation.ts`; las 7 restantes corresponden a alarmas y simulador heredados). |
| **Compilación de producción** | `npm run build` | **Compilación exitosa** con Turbopack (genera las 10 rutas, incluida la parcial `/orders/[orderNumber]/reconciliation`). |

---

## 5. Limitaciones

- **Impresión nativa:** El remito oficial utiliza `window.print()` con clases CSS `@media print` (`print:hidden`, `print:shadow-none`, etc.) para generar la vista de impresión en papel o PDF sin depender de librerías externas pesadas.
- **Cálculo del porcentaje en cliente:** El porcentaje no se persiste en la base de datos (el backend genera la conciliación al vuelo en cada consulta según la consigna).

---

## 6. Guía de defensa (Preguntas y respuestas clave)

### P1. ¿Qué es la conciliación y qué problema de negocio resuelve en la terminal de gas?
**R:** Es la comparación obligatoria entre dos fuentes independientes de medición al concluir la carga: la balanza de pesaje fiscal de entrada/salida (TMS: tara y peso final bruto) y el caudalímetro másico de la boca de carga. Permite detectar desvíos, fugas, errores de calibración o mermas entre lo pesado por báscula (`scaleNet = finalWeight - tare`) y lo inyectado en el camión (`loadedProduct`).

### P2. ¿En qué estado de la orden es válida la conciliación y por qué?
**R:** Es válida **únicamente en Estado 4 (Finalizada)**. En los estados 1 (pendiente de pesaje inicial), 2 (en carga) y 3 (cerrada para carga), aún no se ha registrado el pesaje final del camión en la balanza de salida, por lo que no existe `finalWeight` ni es posible computar `scaleNet`. Si se consulta antes, el backend responde HTTP 409 Conflict.

### P3. ¿El backend guarda la conciliación en una tabla de la base de datos?
**R:** No. Según la especificación de la cátedra, la conciliación se calcula dinámicamente «al vuelo» en cada invocación a `GET /orders/{orderNumber}/reconciliation`, leyendo la tara y el peso final de la orden y agregando las lecturas guardadas del caudalímetro (`COUNT`, `SUM`, `AVG`).

### P4. ¿Por qué el porcentaje de diferencia no viene en el JSON del backend?
**R:** Porque el backend entrega los valores absolutos medidos (`difference` y `scaleNet`). El cálculo porcentual `(difference / scaleNet) * 100` es una métrica derivada de presentación definida en la consigna (Punto 4f) que el frontend calcula y redondea a dos decimales.

### P5. ¿Cómo se protege el cálculo ante casos de borde como división por cero o pesaje neto nulo?
**R:** La función pura `calculateDifferencePercentage` valida que `scaleNet` sea un número finito mayor que cero (`scaleNet > 0`). Si el neto es cero, negativo o no numérico, retorna `null`, evitando valores como `Infinity`, `-Infinity` o `NaN` en la interfaz.

### P6. ¿Qué sucede en la pantalla si una orden finalizó sin lecturas del caudalímetro?
**R:** Si un camión ingresó, se pesó la tara, no cargó gas (o el caudalímetro no registró lecturas válidas) y salió pesándose en balanza, el backend devuelve `loadedProduct = 0.0` y promedios en `null`. La UI detecta esta condición y muestra «0 kg (sin lecturas)» y un aviso de telemetría no disponible, evitando mostrar un promedio de `0 °C` que parecería una temperatura real medida.

### P7. ¿Por qué la pantalla de conciliación necesita consultar dos endpoints (`/reconciliation` y `/orders/{orderNumber}`)?
**R:** Porque el endpoint de conciliación responde estrictamente los datos de la comparativa de balanza y caudalímetro. Para confeccionar el comprobante oficial (remito) con valor de auditoría se requieren los datos de transporte y cliente (patente del camión, nombre del chofer, documento, cliente, producto y fecha), los cuales residen en la cabecera de la orden. El hook `useReconciliation` los solicita concurrentemente con `Promise.all`.

### P8. ¿Cómo maneja la aplicación el intento de ver la conciliación de una orden que no está en estado 4?
**R:** A nivel de navegación, el botón «Ver conciliación final» está condicionado a `order.status === 4`. Si un usuario fuerza la URL directamente, el backend responde `409 Conflict`. El cliente HTTP captura este error y renderiza un estado informativo específico que explica que la orden se encuentra en un estado previo y provee un botón directo para regresar al detalle de la orden.
