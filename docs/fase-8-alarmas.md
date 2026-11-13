# Fase 8 — Alarmas en la UI (consigna 4e)

**Rama:** `fase-8-alarmas` (desde `fase-7-conciliacion`, `af31a38`) · **Fecha:** 13/11/2026 · **Estado:** implementada y probada  
**Objetivo:** que la supervisión y gestión de alarmas de temperatura por correo (consigna 3 y 4e) operen en tiempo real contra los endpoints del backend (`GET /alarms`, `POST /alarms/{id}/acknowledge`, `GET /alarms/config` y `PUT /alarms/config`), sin mocks, mostrando el banner global, campana con contador, estado de envío de e-mail, auditoría de usuario y configuración segura.

---

## 1. Qué se hizo

| Tarea del plan | Resultado |
|---|---|
| **T1 · `alarmsApi` real** | [alarmsApi.ts](file:///home/joa/repos/iw3-gas-terminal-frontend/src/features/alarms/services/alarmsApi.ts): consume los 4 endpoints reales con `apiClient`. Se eliminó completamente `MockStore`. Se implementó `countPending`, paginación (`Page<TemperatureAlarm>`), `acknowledgeAlarm` (enviando solo `{ observation }`, sin username; D-5), `getAlarmConfig` y `updateAlarmConfig`. |
| **T2 · Banner global y contador** | [alarm-banner.tsx](file:///home/joa/repos/iw3-gas-terminal-frontend/src/features/alarms/components/alarm-banner.tsx) integrado en [dashboard-shell.tsx](file:///home/joa/repos/iw3-gas-terminal-frontend/src/components/shared/dashboard-shell.tsx). Detecta alarmas pendientes en tiempo real mediante *polling* (cada 5 s con `usePolling`), muestra orden y temperaturas, y abre directamente el modal de aceptación. La campana en la barra superior ([navbar.tsx](file:///home/joa/repos/iw3-gas-terminal-frontend/src/components/shared/navbar.tsx)) refleja el conteo de pendientes con badge interactivo. |
| **T3 · Tabla de alarmas y auditoría** | [alarm-table.tsx](file:///home/joa/repos/iw3-gas-terminal-frontend/src/features/alarms/components/alarm-table.tsx): listado con orden descendente por fecha de disparo, enlace directo a `/orders/{orderNumber}`, badges de estado (`PENDING` vs `ACKNOWLEDGED`), estado de entrega de e-mail (`emailSentAt` con fecha o «Correo no enviado»), y datos de aceptación (usuario responsable, fecha/hora y observación). Paginación integrada con [pagination.tsx](file:///home/joa/repos/iw3-gas-terminal-frontend/src/components/shared/pagination.tsx). |
| **T4 · Modal de aceptación (D-5)** | [alarm-ack-modal.tsx](file:///home/joa/repos/iw3-gas-terminal-frontend/src/features/alarms/components/alarm-ack-modal.tsx): permite ingresar una observación opcional (máx. 500 caracteres). El usuario responsable no se envía en el cuerpo: el backend lo extrae de los claims del token JWT. La acción está protegida con `PermissionGate permission="alarms:acknowledge"` (solo `ADMIN` y `SUPERVISOR`). |
| **T5 · Configuración de umbral y correos** | [alarm-config-form.tsx](file:///home/joa/repos/iw3-gas-terminal-frontend/src/features/alarms/components/alarm-config-form.tsx): edición exclusiva para `ADMIN`; `SUPERVISOR` accede en modo solo lectura (`readOnly`). Validación de umbral numérico finito y lista de hasta 20 correos sin duplicados. |
| **T6 · Validaciones y tests unitarios** | [alarm-validation.ts](file:///home/joa/repos/iw3-gas-terminal-frontend/src/features/alarms/lib/alarm-validation.ts): módulo puro con 13 pruebas unitarias en [alarm-validation.test.mjs](file:///home/joa/repos/iw3-gas-terminal-frontend/src/features/alarms/lib/alarm-validation.test.mjs) (152 tests totales pasando). Este informe y guía de defensa. |

### Archivos tocados

| Archivo | Motivo |
|---|---|
| [alarmsApi.ts](file:///home/joa/repos/iw3-gas-terminal-frontend/src/features/alarms/services/alarmsApi.ts) | Cliente HTTP hacia `GET /alarms`, `POST .../acknowledge`, `GET /alarms/config` y `PUT /alarms/config`. Sin mocks. |
| [useAlarms.ts](file:///home/joa/repos/iw3-gas-terminal-frontend/src/features/alarms/hooks/useAlarms.ts) | Hook que gestiona polling en tiempo real con `usePolling`, filtros (`ALL`, `PENDING`, `ACKNOWLEDGED`), paginación, recuento de pendientes y llamadas de mutación. |
| [alarm-banner.tsx](file:///home/joa/repos/iw3-gas-terminal-frontend/src/features/alarms/components/alarm-banner.tsx) | Banner de advertencia roja con animación de entrada y acción directa de aceptación. |
| [alarm-table.tsx](file:///home/joa/repos/iw3-gas-terminal-frontend/src/features/alarms/components/alarm-table.tsx) | Tabla con datos reales, estado de e-mail (`emailSentAt`), enlace a orden y auditoría. |
| [alarm-ack-modal.tsx](file:///home/joa/repos/iw3-gas-terminal-frontend/src/features/alarms/components/alarm-ack-modal.tsx) | Modal de aceptación con validación de observación y sin enviar usuario en el JSON (D-5). |
| [alarm-config-form.tsx](file:///home/joa/repos/iw3-gas-terminal-frontend/src/features/alarms/components/alarm-config-form.tsx) | Formulario con validación de correos, límite de 20 destinatarios, feedback de éxito/error y modo solo lectura. |
| [alarm-validation.ts](file:///home/joa/repos/iw3-gas-terminal-frontend/src/features/alarms/lib/alarm-validation.ts) (+test) | Validaciones puras de correos, umbral y longitud de observación. |
| [dashboard-shell.tsx](file:///home/joa/repos/iw3-gas-terminal-frontend/src/components/shared/dashboard-shell.tsx) | Marco autenticado con tipos de `@/types/api`, banner y modal global. |
| [page.tsx](file:///home/joa/repos/iw3-gas-terminal-frontend/src/app/(dashboard)/alarms/page.tsx) | Pantalla de alarmas con pestañas (Historial / Configuración), filtros de estado y paginación. |
| [alarm.ts](file:///home/joa/repos/iw3-gas-terminal-frontend/src/types/alarm.ts) | Marcado como tipo legacy保留 para `mockStore.ts` hasta la Fase 9. |

---

## 2. Decisiones de diseño

- **F8-1 · Polling controlado sin acumulación:** Al igual que en órdenes, las alarmas se consultan mediante `usePolling` (`setTimeout` encadenado). Si el usuario minimiza o cambia de pestaña en el navegador, las peticiones se pausan automáticamente y se retoman al volver al foco.
- **F8-2 · D-5: El usuario que acepta la alarma sale del token:** En la versión heredada, la UI enviaba `{ username, observation }` en el cuerpo. En el backend real (Fase 2 y contrato congelado), el método `@PostMapping("/alarms/{id}/acknowledge")` extrae el `username` del `Principal` autenticado en Spring Security. La UI respeta estrictamente esto y solo envía `{ observation }`.
- **F8-3 · Visibilidad de fallo de correo (`emailSentAt`):** La consigna establece que el fallo del servidor SMTP no debe abortar la carga (D-4). Cuando el e-mail no pudo enviarse, `emailSentAt` es `null`. La tabla lo muestra explícitamente como «Correo no enviado» para que los supervisores sepan que deben tomar contacto manual.
- **F8-4 · Roles en la UI coherentes con la matriz del backend:**
  - `OPERADOR`: puede ver las alarmas (`GET /alarms`), pero no tiene botón para aceptarlas (recibiría 403) ni puede ver la pestaña de configuración.
  - `SUPERVISOR`: puede ver y aceptar alarmas (`POST /alarms/{id}/acknowledge`) y consultar la configuración (`GET /alarms/config`), pero en modo lectura (`readOnly`).
  - `ADMIN`: tiene control total (aceptar y editar la configuración con `PUT /alarms/config`).
- **F8-5 · Validación previa de correos en cliente:** La API responde 400 si se envían correos repetidos o con sintaxis inválida. La UI valida el formato mediante regex y previene duplicados antes de enviar la petición.
- **F8-6 · Paginación en servidor:** Las alarmas se consultan con `page` y `size` (20 por página) manteniendo orden descendente por fecha de disparo.

---

## 3. Recorrido de los datos

### Disparo y detección en tiempo real
1. Un caudalímetro envía una lectura con `temperature > umbral` a `POST /integration/loader/orders/{n}/details`.
2. El backend crea la alarma en estado `PENDING` y publica el evento para envío de correo asíncrono.
3. El frontend, a través de `useAlarms` en `DashboardShell`, consulta en segundo plano `GET /alarms?status=PENDING&size=10`.
4. El banner global [alarm-banner.tsx](file:///home/joa/repos/iw3-gas-terminal-frontend/src/features/alarms/components/alarm-banner.tsx) se activa en todas las pantallas del dashboard mostrando la orden y la temperatura registrada, y la campana de la barra de navegación incrementa el contador.

### Aceptación de la alarma
1. Un `SUPERVISOR` o `ADMIN` hace clic en «Aceptar Alarma» (desde el banner o desde la tabla de `/alarms`).
2. Se abre `AlarmAckModal` mostrando la temperatura, el umbral y el usuario responsable extraído de la sesión.
3. Opcionalmente escribe una observación (ej: «Se calibró la válvula de venteo») y confirma.
4. `alarmsApi.acknowledgeAlarm(id, observation)` envía `POST /alarms/{id}/acknowledge` con `Authorization: Bearer <token>`.
5. El backend registra `status = ACKNOWLEDGED`, fecha de aceptación y el usuario del token.
6. La respuesta actualiza la tabla y el banner desaparece automáticamente al reducirse el conteo a 0.

### Configuración de umbral y destinatarios
1. Un `ADMIN` ingresa a la pestaña «Configurar Umbral» en `/alarms`.
2. `AlarmConfigForm` carga `temperatureThreshold` y `recipientEmails` de `GET /alarms/config`.
3. El administrador modifica el umbral y agrega/quita correos.
4. Al presionar «Guardar Configuración», se validan los campos y se envía `PUT /alarms/config`.

---

## 4. Pruebas ejecutadas

| Prueba | Comando | Resultado |
|---|---|---|
| **Pruebas unitarias** | `npm test` | **152 tests pasando, 0 fallas** (13 tests en `alarm-validation.test.mjs` validando correos, duplicados, límites y umbrales). |
| **Chequeo de tipos** | `npx tsc --noEmit` | **0 errores** de TypeScript. |
| **Linter** | `npm run lint` | **0 errores, 1 advertencia** (se eliminaron las 6 advertencias `any` que existían en alarmas; la única advertencia restante es de `useLegacyOrders.ts` en el simulador). |
| **Compilación de producción** | `npm run build` | **Compilación exitosa** (10 rutas estáticas y dinámicas generadas limpiamente). |

---

## 5. Limitaciones

- **Regla de no reenvío (D-3):** Mientras exista una alarma en estado `PENDING` para una orden, lecturas posteriores que sigan superando el umbral no generan nuevas alarmas ni envían más correos. Una vez aceptada (`ACKNOWLEDGED`), una nueva superación de temperatura en esa orden vuelve a alarmar.
- **Sin reintento automático de correo:** Si el servidor SMTP configurado en el backend falla en el instante del commit, el correo queda no enviado (`emailSentAt: null`). La UI lo comunica claramente sin bloquear el proceso de carga.

---

## 6. Guía de defensa (Preguntas y respuestas clave)

### P1. ¿Cuál es el requerimiento de la consigna del final respecto a las alarmas?
**R:** La consigna (Puntos 3 y 4e) exige:
1. Detectar temperaturas por encima de un umbral configurable durante la carga (Punto 3).
2. Enviar un correo electrónico a destinatarios configurables una sola vez al superar el umbral.
3. No reenviar correos ni duplicar alarmas mientras permanezca pendiente para esa orden.
4. Permitir la aceptación por parte de un usuario autorizado, registrando auditoría completa (usuario, fecha, hora y observación opcional).
5. Permitir a los supervisores/administradores ver y gestionar las alarmas desde la interfaz web.

### P2. ¿Quién determina qué usuario aceptó la alarma en el sistema?
**R:** El backend, a través del token JWT. La petición `POST /alarms/{id}/acknowledge` no acepta un nombre de usuario en el JSON; de lo contrario, un operador podría falsificar la identidad de otro usuario. Spring Security extrae el `username` del claim `sub` del token criptográfico del usuario autenticado.

### P3. ¿Qué roles pueden interactuar con las alarmas en la interfaz?
**R:**
- `OPERADOR`: puede listar y ver las alarmas en `/alarms` y ver la campana en el navbar, pero no puede aceptarlas ni ver la pestaña de configuración.
- `SUPERVISOR`: puede ver alarmas, aceptarlas con observación y ver la configuración en modo lectura.
- `ADMIN`: tiene acceso completo, incluyendo la edición del umbral y de los destinatarios de correo.

### P4. ¿Qué ocurre si dos supervisores intentan aceptar la misma alarma simultáneamente?
**R:** El primero en llegar la acepta exitosamente (HTTP 200). El segundo recibe un HTTP 409 Conflict («La alarma ya fue aceptada»). El cliente HTTP captura este 409, muestra el mensaje oficial del backend y refresca la tabla automáticamente sin romper la interfaz.

### P5. ¿Por qué el envío de correo de la alarma no bloquea la recepción de lecturas del caudalímetro?
**R:** Porque las lecturas del caudalímetro son críticas para el proceso industrial de carga de GLP (reciben telemetría cada pocos segundos). Si el servidor SMTP tardara 10 segundos o tuviera una falla de red, demorar la lectura pondría en riesgo la seguridad de la planta. Por diseño (D-4), el backend registra la lectura y la alarma en la base de datos de inmediato y delega el envío de correo a un evento asíncrono posterior al commit (`@TransactionalEventListener`). Si el correo falla, la lectura igual se guarda.

### P6. ¿Cómo se entera el frontend de una nueva alarma si no hay WebSockets en el backend?
**R:** Mediante *polling* inteligente con `usePolling` cada 5 segundos. La función encadena peticiones usando `setTimeout` (evitando saturación de red), se desactiva cuando la pestaña del navegador está en segundo plano y refresca inmediatamente al volver al foco.

### P7. ¿Qué validaciones realiza el frontend antes de enviar una nueva configuración de alarmas?
**R:** Valida que el umbral de temperatura sea un valor numérico finito dentro del rango operativo (-100 °C a 200 °C), que la lista de destinatarios no supere los 20 correos, que cada correo cumpla con el formato sintáctico de email y que no existan correos repetidos (ignorando mayúsculas/minúsculas).

### P8. ¿Qué significa que en la tabla aparezca «Correo no enviado»?
**R:** Indica que la alarma se disparó y quedó registrada en la base de datos, pero el campo `emailSentAt` devuelto por el backend es `null`. Esto sucede si no había destinatarios configurados o si el servidor SMTP de la planta experimentó una desconexión al momento del disparo. Permite al personal tomar medidas directas en planta sin asumir que el aviso ya llegó.
