# Fase 6 — Órdenes: listado, filtros, monitoreo, detalle, ETA y tiempo transcurrido

**Rama:** `fase-6-ordenes` (desde `main`, `d1ce4d6`) · **Fecha:** 12/11/2026 · **Estado:** integrada en `main` (PR #6) y desplegada
**Objetivo:** que la administración y el monitoreo de órdenes (consigna 4b, 4c y 4d) usen los datos reales del backend, se actualicen solos y calculen bien la ETA y el tiempo transcurrido.
**Regla 9 (Next 16):** se mantiene lo leído en la Fase 5 (sin `usePathname`/`useSearchParams` nuevos; la página de detalle recibe `params` como `Promise` y la resuelve con `React.use` dentro de `Suspense`).

## 1. Qué se hizo

| Tarea del plan | Resultado |
|---|---|
| T1 · `ordersApi` real | `features/orders/services/ordersApi.ts`: `getOrders` (filtro `status`, `sort`, `page`, `size`), `getOrder`, `getStatusLog`, `getReadings` y `closeOrder`, con los tipos de `@/types/api` y **sin datos de respaldo**. La ruta pasó de `/orders/[id]` a `/orders/[orderNumber]` |
| T2 · Listado | Número, estado, camión (patente) y chofer, cliente y producto, carga/preset con barra, **temperatura, densidad y caudal** de la última lectura, ETA y tiempo transcurrido. **Filtro por estado y orden se aplican en el servidor** (5 campos permitidos, ascendente y descendente) y paginación de 20. Carga, vacío y error con el mensaje real |
| T3 · Tablero | Conteo por estado (`totalElements` de `GET /orders?status=N&size=1`), alarmas pendientes, órdenes en carga con ETA y tiempo transcurrido, y las últimas 10 órdenes |
| T4 · Detalle | Cabecera, pesajes (tara, activación, final con su fecha; **sin PIN**, D-6), cuatro medidores, barra de progreso, camión con cisternas, chofer, cliente y producto |
| T5 · ETA | `(preset − masa acumulada) / caudal` con los datos reales y casos de borde: sin lecturas, carga completa, caudal cero o ausente, y fuera del estado 2 |
| T6 · Tiempo transcurrido | Desde `loadingStartDateTime` en hora de Argentina y **solo en estado 2**; en 1, 3 y 4 se muestra «—» con la explicación |
| T7 · Historial y lecturas | Línea de tiempo de `status-log` y tabla paginada de `details` (por defecto, las últimas, que se siguen solas) |
| T8 · Cerrar orden | Solo en estado 2 y con rol permitido, **con confirmación**, contra `POST /integration/loader/orders/{n}/close`; el 409 muestra el mensaje real y la pantalla vuelve a leer la orden |
| T9 · Pruebas y documento | 11 tests nuevos, 5 mutaciones y 93 + 2 verificaciones con Chrome real; este informe |

### Archivos tocados

| Archivo | Motivo |
|---|---|
| `features/orders/lib/order-metrics.ts` (+test) | ETA, progreso y formato; módulo puro sin imports en tiempo de ejecución |
| `lib/dates.ts` | `loadingElapsedMillis(status, inicio, ahora)`: tiempo transcurrido solo en estado 2 |
| `lib/use-polling.ts`, `lib/use-now.ts` | Tiempo real: *polling* sin pedidos superpuestos, con pausa en pestaña oculta, y reloj de 1 s |
| `features/orders/hooks/*`, `services/ordersApi.ts` | Datos reales con los hooks `useOrders`, `useOrderCounts`, `useOrder`, `useOrderStatusLog`, `useOrderReadings` y `useCloseOrder` |
| `features/orders/components/*` | Tabla, filtros, medidores, barra, ETA/transcurrido, camión, línea de tiempo, lecturas y botón de cierre (los cuatro primeros reescritos con los tipos reales) |
| `components/shared/{state-badge,pagination}.tsx` | Etiqueta con los textos oficiales y paginación |
| `app/(dashboard)/page.tsx`, `orders/page.tsx`, `orders/[orderNumber]/page.tsx` | Pantallas |
| `lib/formatters.ts` | Un dato inexistente se muestra «—», no «0 kg»; se quitó la unidad «kg/m³» de la densidad (el contrato solo dice «entre 0 y 1») |
| `lib/calculations.ts`, `types/telemetry.ts` | Se quitaron la ETA y el transcurrido viejos (quedó la conciliación, de la Fase 7) |
| `features/simulator/{services/legacyOrdersApi,hooks/useLegacyOrders}.ts` | El `ordersApi` y el hook viejos **se movieron** acá: el simulador heredado los sigue usando hasta la Fase 9 |
| `alarmsApi.ts` | `countPending` real, para el tablero |

## 2. Decisiones de diseño

- **F-1 · Filtro y orden en el servidor, no en el navegador.** Con paginación, filtrar la página que ya llegó mentiría (mostraría «no hay órdenes en estado 3» aunque estén en la página siguiente). El estado y los 5 campos de orden van a `GET /orders`.
- **F-2 · Sin búsqueda por texto.** El backend no la ofrece (`GET /orders` solo filtra por `status`); el plan la mencionaba. Hacerla en el cliente buscaría solo en la página actual. Queda anotado como limitación y, si se la quiere, es un cambio de backend (regla 2).
- **F-3 · Polling con `setTimeout` encadenado**, no `setInterval`: el siguiente pedido se programa cuando termina el anterior, así que un backend lento no acumula pedidos. Se pausa con la pestaña oculta y se pide de inmediato al volver. La orden en carga se refresca cada 2 s; en otros estados, cada 10 s; el listado cada 4 s.
- **F-4 · Un fallo no borra lo que se veía.** Si el refresco falla, queda la última información con un aviso con el mensaje real; al volver la conexión, el aviso desaparece solo.
- **F-5 · «Sin dato» no es cero.** Una orden sin lecturas muestra «—» y «Sin lecturas», no «0 kg» ni un ETA.
- **F-6 · El tiempo transcurrido corre en el navegador** (un reloj de 1 s) desde `loadingStartDateTime`, interpretado como hora de Argentina (`parseBackendDate`), y nunca da negativo. La ETA se recalcula con cada lectura nueva.
- **F-7 · No se afirma «bomba activa o detenida».** El backend solo informa la última lectura; la pantalla muestra a qué hora llegó.
- **F-8 · Cerrar pide confirmación.** El cambio de estado es irreversible. Un 409 (otra persona ya la cerró) muestra el mensaje del backend y se vuelve a leer la orden.
- **F-9 · El número de orden de la URL se valida** (entero de hasta 15 dígitos) antes de armar ningún pedido con él.

## 3. Recorrido de los datos (detalle de una orden en carga)

1. `/orders/217458152` → `OrderDetailPage` resuelve `params` y valida el número.
2. `useOrder` → `usePolling` → `ordersApi.getOrder` → `apiClient` agrega el token → `GET /orders/217458152`. Repite cada 2 s porque `status === 2`.
3. `useOrderStatusLog` (una vez por estado) y `useOrderReadings` (la última página, cada 3 s con carga en curso).
4. `calculateEta` y `loadingElapsedMillis` producen lo que muestran `EtaDisplay`, `LiveLoadMeter` y los medidores; `useNow` hace correr el cronómetro.
5. «Cerrar» → `CloseOrderButton` (solo rol permitido y estado 2) → confirmación → `POST …/close` → se vuelve a leer la orden y el historial.

## 4. Pruebas ejecutadas (12/11/2026)

| Prueba | Resultado |
|---|---|
| `npm test` (Node 24 local) | 127 tests, 0 fallas (11 nuevos: ETA, progreso y tiempo transcurrido; se quitaron 4 de los cálculos viejos) |
| `tsc`, `npm run lint`, `npm run build` | sin errores; 8 advertencias `any` heredadas (antes 10; ninguna nueva) |
| Mutaciones | 5 de 5 detectadas: ETA sin restar lo cargado, ETA fuera del estado 2, caudal cero, transcurrido fuera del estado 2, transcurrido sin zona horaria |
| **Chrome real, backend real y órdenes reales** | **93 verificaciones, 0 fallas**, más 2 del cierre con 409 |
| Réplica del CI (copia limpia sin `node_modules`) | `npm ci` con npm 10 ok, lint 0 errores, build ok y los 127 tests también con **Node 22** (lint y build corridos con Node 24) |

Las órdenes de prueba las creó la **API de integración real** (SAP, balanza y sistema de carga), no se simularon. Escenarios: (1) conteos del tablero iguales a la API; (2) filtro por los 4 estados, 5 órdenes distintas y paginación iguales a `GET /orders` y sin ningún 400; (3) ETA del detalle igual al cálculo manual «(15000 − 400) / 3000 = 4 h 52 min», 2,7 %, tara, cisternas (18.000 L), 2 transiciones y 3 lecturas, **tiempo transcurrido igual a (ahora − `loadingStartDateTime`) en hora de Argentina (±3 s)**, corriendo en vivo; (4) casos de borde: estado 2 sin lecturas, y estados 1, 3 y 4 sin ETA ni cronómetro; (5) **una lectura nueva enviada por la API aparece sola en menos de 8 s**, la ETA pasa de «6 h 00 min» a «2 h 30 min», al completar el preset dice «Completa» y, cuando otra persona cierra la orden, la pantalla pasa sola al estado 3 con el cronómetro detenido y el historial actualizado; (6) 404 con el mensaje real, número inválido y caída de la red con recuperación; (7) cierre desde la interfaz como `operador` (confirmación, cancelar no cierra, el historial registra al actor) y el 409 con el mensaje del backend; (8) roles; (9) con la pestaña oculta no se hacen pedidos (3 en 6,5 s visible, 0 oculta) y al volver se pide enseguida.

## 5. Limitaciones y observaciones

- **El ETA es una estimación lineal** con el caudal de la última lectura; no considera que el caudal cambie.
- **No hay búsqueda por texto** (F-2) ni WebSockets: la actualización es por *polling* (D-8) y puede tardar hasta 2 s en reflejar una lectura.
- **El avance «en vivo» depende del reloj del navegador** para el cronómetro: un navegador con la hora corrida mostraría un transcurrido corrido (es lo que dice la consigna: calcularlo desde el inicio de la carga).
- **La conciliación (Fase 7), las alarmas (Fase 8) y el simulador (Fase 9) siguen siendo las pantallas heredadas.** La orden de estado 4 enlaza a `/orders/{n}/reconciliation`, que ya recibe el número real pero conserva su mock y sus tipos viejos hasta la Fase 7.
- **La temperatura no se resalta** contra el umbral de alarma en el detalle: leer el umbral exige permisos de ADMIN o SUPERVISOR; el aviso de alarma es de la Fase 8.
- **Densidad sin unidad:** el contrato solo dice «entre 0 y 1».
- **Las órdenes de prueba quedaron en la base de desarrollo** (no es la de producción).

## 6. Guía de defensa

1. **¿Cómo calcula el frontend la ETA?** `(preset − masa acumulada) / caudal`, con `preset`, `lastAccumulatedMass` y `lastFlowRate` de la orden, convertido a segundos. Los casos de borde se devuelven con un `kind` explícito (sin lecturas, completa, caudal cero, fuera de carga) para no mostrar un tiempo inventado.
2. **¿Por qué el tiempo transcurrido es solo del estado 2?** La consigna lo exige: es el tiempo desde el inicio de la carga mientras se está cargando. En 3 y 4 la carga ya terminó; seguir contando sería un dato falso.
3. **¿Cómo se evita el error de zona horaria?** El backend manda fechas sin zona en hora de Argentina; `parseBackendDate` les agrega `-03:00`, así que el resultado no depende de la zona del navegador (hay una prueba que corre con tres zonas distintas).
4. **¿Cómo se actualiza en tiempo real si no hay WebSockets?** Con *polling*: cada pantalla repite el pedido cada pocos segundos, sin superponerlos, y se pausa con la pestaña oculta. Es lo que enseñó la cátedra y lo que el backend permite (D-8).
5. **¿Por qué el filtro y el orden se hacen en el servidor?** Porque el listado está paginado: filtrar en el navegador solo vería la página actual. Por eso el estado y el campo van como `status` y `sort=campo,dirección`.
6. **¿Qué pasa si el backend falla mientras miro una orden?** La pantalla conserva la última información, muestra el mensaje real y se recupera sola cuando la conexión vuelve.
7. **¿Quién puede cerrar una orden y cómo se cuida?** ADMIN, SUPERVISOR, OPERADOR y LOADER (matriz del backend), solo en estado 2 y con confirmación. Si otra persona la cerró antes, el backend responde 409 y se muestra su mensaje.
8. **¿Por qué no se muestra el PIN de activación?** El backend no lo publica en el detalle: solo viaja en la respuesta de la tara (D-6) y se ve en el simulador.
9. **¿Por qué una orden se identifica por `orderNumber` y no por `id`?** Es la clave que usa la API (`/orders/{orderNumber}`); el `id` es interno de la base.
10. **¿Cómo se sabe cuántas órdenes hay por estado sin un endpoint de conteo?** Se pide `GET /orders?status=N&size=1` y se lee `totalElements` de la paginación (cuatro pedidos livianos).
11. **¿Por qué «—» y no «0» cuando no hay lecturas?** Un cero parecería una medición (una temperatura de 0 °C). La ausencia de dato se muestra como tal.

**Qué debe poder explicar cada integrante:** el recorrido de los datos de una orden en carga hasta la pantalla, la fórmula de la ETA y sus casos de borde, por qué el transcurrido es solo del estado 2 y cómo se evita el problema de zona horaria, y cómo funciona el *polling*.
