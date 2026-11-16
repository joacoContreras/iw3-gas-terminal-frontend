# Plan de trabajo — Examen final (backend: roles y alarmas · frontend integrado)

**Creado:** 12/11/2026 · **Reglas de trabajo:** `CLAUDE.md` (sección 3) · **Consigna:** `Trabajo Integrador - Ingeniería Web 3 2026.pdf`

## 1. Objetivo

Llegar al final con el sistema completo y **funcionando de punta a punta contra el backend real**:

1. Backend con **roles** que regulen el consumo de las APIs y **alarma de temperatura por e-mail** (consigna del final, puntos 2 y 3).
2. **Frontend** con autenticación, monitoreo en tiempo real, ETA, tiempo transcurrido, gestión de alarmas y conciliaciones (punto 4).
3. Despliegue en la VM y cada integrante capaz de **explicar todo el flujo** (la evaluación es individual).

## 2. Punto de partida (verificado el 12/11/2026)

**Backend (`main`, entregado en el parcial):** Puntos 1 a 5 completos, 13 rutas documentadas con Swagger, 40 tests,
colección Postman de 154 pedidos sin fallas, desplegado en la VM. **No tiene** roles aplicados (el token lleva los
roles y `@EnableMethodSecurity` está activo, pero ningún endpoint usa `@PreAuthorize`), **ni alarmas, ni correo**
(sin dependencia `spring-boot-starter-mail`, sin código de alarmas). El listado no filtra ni ordena (orden fijo).

**Frontend (repo de Joaco, 6 commits):** UI con 7 pantallas, polling, ETA y tiempo transcurrido con 5 tests, CI/CD a la VM.
**Pero** se escribió contra una API imaginada y cae a un mock en memoria ante cualquier error:

| El frontend asume | El backend real |
|---|---|
| `GET /orders?state=&search=` → array | `GET /orders?page=&size=` → `{ content, page }`, sin filtros |
| `/orders/{id}` (id de base) | `/orders/{orderNumber}` |
| `POST /orders/{id}/close` | `POST /integration/loader/orders/{n}/close` |
| `POST /integration/sap/order` | `POST /integration/sap/orders` |
| `POST /integration/tms/tare` `{orderId, initialWeight}` | `POST /integration/tms/orders/{n}/tare` `{weight}` |
| `POST /integration/pump/auth` `{orderCode, password}` | `POST /integration/loader/activation` `{orderNumber, password}` |
| `POST /integration/pump/telemetry` | `POST /integration/loader/orders/{n}/details` |
| `POST /integration/tms/final-weight` `{orderId, finalWeight}` | `POST /integration/tms/orders/{n}/final-weight` `{weight}` |
| `/alarms`, `/alarms/config`, `/alarms/{id}/acknowledge` | no existen |
| `state`, `initialWeight`, `scheduledDate`, `receivedAt`, `loadStartTime`, `loadEndTime` | `status`, `tare`, `plannedLoadDateTime`, `receptionDateTime`, `loadingStartDateTime`, `loadingEndDateTime` |
| `truck.patent`, `cisterns[].cisternNumber/capacity`, `customer.businessName` | `truck.plate`, `tanks[].number/capacityLiters`, `customer.companyName` |
| conciliación con patente, chofer, porcentaje | `tare, finalWeight, loadedProduct, scaleNet, difference` + 3 promedios |
| `activationPassword` en la orden | `@JsonIgnore`: solo se entrega en la respuesta de la tara |
| login: coincide | `POST /login` con formulario, JWT en texto plano |

Atajos de demo a eliminar: usuario admin y token falsos si no hay sesión, JWT falso si `/login` falla, sin protección de
rutas, `RoleGuard` sin uso, `catch` que esconden errores reales. El frontend **tampoco usa** dos endpoints reales:
`status-log` y `details` (histórico de lecturas).

## 3. Orden de trabajo y por qué

```
Fase 0 ─ Línea base ──▶ BLOQUE A: BACKEND (1 → 2 → 3) ──▶ BLOQUE B: FRONTEND (4 → 5 → 6 → 7 → 8 → 9) ──▶ Fase 10 ─ Cierre
```

El backend va primero (D-1): el frontend se conecta **una sola vez** al contrato final. El error del frontend
heredado fue justamente construirse contra un contrato que no existía. Al cerrar la Fase 3 se congela el contrato en
`docs/contrato-api.md`, generado desde `/v3/api-docs`.

Todas las fases siguen el ciclo de `CLAUDE.md`: presentar objetivo y criterios → aprobación → implementar → probar contra
el backend real → documentar → resumen → autorización para continuar.

## 4. Fases

### Fase 0 — Línea base y puesta en marcha (ambos repos)

**Objetivo:** saber exactamente desde dónde partimos, sin cambiar código.

| Tarea | Detalle |
|---|---|
| T1 | Frontend: `npm ci`, `npm run lint`, `npm test`, `npm run build`. Anotar resultados y advertencias (`next.config.ts` usa opciones y un plugin que hay que comprobar contra Next 16.4) |
| T2 | Leer `node_modules/next/dist/docs/` (regla 9) y anotar lo que condiciona el trabajo |
| T3 | Backend: levantar MySQL y la aplicación en local con el perfil `mysqldev`; sembrar el usuario `admin`; verificar el login con `curl` |
| T4 | Backend: `./mvnw -B test` y colección Postman con newman (línea base: 40 tests; 154 pedidos y 364 aserciones) |
| T5 | Escribir `docs/fase-0-linea-base.md` con lo medido |

**Criterios:** ambos repos compilan y arrancan; la línea base está medida y escrita; ningún archivo de código modificado.
**Nota:** T3 y T4 necesitan Docker; se encienden solo para medir y se apagan después.

---

## BLOQUE A — Backend (repo `iw3-gas-terminal-backend`, ramas `final-fase-N-<tema>`; `main` intacto)

### 4.1 Fase 1 — Roles (consigna final, punto 2)

> **Estado (12/11/2026): completada e integrada en `main` del backend (PR #18) y desplegada.**
> 72 de 72, Postman 186 pedidos y 428 aserciones sin fallas. Informe y guía de defensa: `docs/final-fase-1-roles.md` del backend. T4: se eligió un
> `AccessDeniedHandler` propio (`RestAccessDeniedHandler`) porque el 403 sin handler sale vacío. Hallazgos: ver la sección 6 del informe y la nota sobre `origin/main` en `CLAUDE.md`.

**Objetivo:** que los roles regulen quién puede consumir cada endpoint.

**Matriz de roles propuesta (se aprueba antes de codear):**

| Endpoint | ADMIN | SUPERVISOR | OPERADOR | SAP | TMS | LOADER |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| `POST /integration/sap/orders` | ✔ | | | ✔ | | |
| `POST /integration/tms/orders/{n}/tare` y `/final-weight` | ✔ | | | | ✔ | |
| `POST /integration/loader/activation` y `/orders/{n}/details` | ✔ | | | | | ✔ |
| `POST /integration/loader/orders/{n}/close` | ✔ | ✔ | ✔ | | | ✔ |
| `GET /orders`, `/{n}`, `/{n}/details`, `/{n}/status-log`, `/{n}/reconciliation` | ✔ | ✔ | ✔ | | | |
| `GET /alarms` (Fase 2) | ✔ | ✔ | ✔ | | | |
| `POST /alarms/{id}/acknowledge` (Fase 2) — "usuario autorizado" | ✔ | ✔ | | | | |
| `GET /alarms/config` (Fase 2) | ✔ | ✔ | | | | |
| `PUT /alarms/config` (Fase 2) | ✔ | | | | | |
| `GET /demo/encodepass` | ✔ | | | | | |

`ADMIN` accede a todo (así la colección Postman actual y el simulador del frontend siguen funcionando). Los roles
`SAP`, `TMS` y `LOADER` representan a los **sistemas externos**; `SUPERVISOR` y `OPERADOR`, a las personas.

| Tarea | Detalle |
|---|---|
| T1 | Aprobar la matriz (cambios del usuario incluidos) |
| T2 | Ampliar `docs/sql/seed-dev-users.sql`: los 6 roles y un usuario de prueba por rol (hashes BCrypt generados con `/demo/encodepass`) |
| T3 | `@PreAuthorize("hasAnyRole(...)")` en cada método de los controllers, como en `MailRestController` de la cátedra |
| T4 | Respuesta **403** con el formato estándar `{ message, code, devInfo }` (comprobar primero qué devuelve hoy un `AccessDeniedException` y elegir `AccessDeniedHandler` o `@ExceptionHandler` según lo medido) |
| T5 | Tests: por cada fila de la matriz, 200 con el rol permitido y 403 con uno no permitido (`spring-security-test` ya está en el `pom`) |
| T6 | Postman: carpeta `08 - Roles` (un login por rol, la matriz completa); las carpetas 00 a 07 no cambian |
| T7 | `docs/fase-N-roles.md` (informe + guía de defensa) |

**Archivos probables:** `OrderRestController`, `OrderSapRestController`, `OrderTmsRestController`, `OrderLoaderRestController`,
`AuthRestController` (`/demo`), `SecurityConfiguration`, `docs/sql/`, Postman, tests, docs.

**Criterios:** cada celda de la matriz verificada (200 o 403); sin token sigue siendo 401; las 154 peticiones actuales
con `admin` siguen con 0 fallas; `./mvnw -B test` pasa con los tests nuevos.
**Pasos manuales con autorización:** sembrar roles y usuarios en la base de la VM (hoy solo existe `martin`, `ROLE_ADMIN`).

### 4.2 Fase 2 — Alarma de temperatura por e-mail (consigna final, punto 3)

> **Estado (12/11/2026): completada e integrada en `main` del backend (PR #18) y desplegada** (la VM publica las 4 rutas de alarmas).
> Resultados: 215 tests, Postman 219 pedidos y 483 aserciones, escenario real de 42 verificaciones (con un servidor SMTP de mentira), concurrencia de 40 lecturas con 1 alarma y 2 correos.
> Dos defectos hallados probando y corregidos (remitente ausente y lista de destinatarios con valor por defecto). Contrato para el frontend: `Alarm { id, orderNumber, temperature, threshold, status, triggeredAt, emailSentAt, acknowledgedBy, acknowledgedAt, observation }` y `AlarmConfig { temperatureThreshold, recipientEmails }`.
> Sin reintentos de envío: la UI debe mostrar «correo no enviado» cuando `emailSentAt` es nulo. Informe y guía de defensa en `docs/final-fase-2-alarmas.md` del backend.

**Objetivo:** al recibir una lectura válida con temperatura sobre el umbral, crear una alarma y avisar por correo **una sola
vez** hasta que un usuario autorizado la acepte.

**Reglas (D-3, D-4, D-5):** condición `temperatura > umbral` sobre lecturas **válidas y guardadas** · alarma **por orden**
(una pendiente por orden a la vez) · umbral y destinatarios **globales y configurables** · un fallo del correo no
afecta la lectura (siempre `200 { saved }`) · envío asíncrono y **posterior al commit** · quien acepta sale del token.

| Tarea | Detalle |
|---|---|
| T1 | Modelo: `TemperatureAlarm` (orden, temperatura, umbral, fecha, estado `PENDING`/`ACKNOWLEDGED`, aceptada por, fecha de aceptación, observación, fecha de envío del correo) y `AlarmConfig` (umbral y destinatarios; una sola fila, con valor por defecto) |
| T2 | Dependencia `spring-boot-starter-mail`; `EmailBusiness` de la cátedra (corrigiendo el import `execption`); configuración SMTP por variables de entorno `SMTP_USER` / `SMTP_PASS` (nunca en el repo) |
| T3 | `AlarmBusiness` (`IAlarmBusiness`): evaluar la lectura, crear la alarma, aceptar (404 → 409 si ya está aceptada), listar con filtro de estado, leer y actualizar la configuración (400 si el umbral o los correos son inválidos) |
| T4 | Disparo dentro de `OrderDetailBusiness.add`, **en la misma transacción y bajo el bloqueo de la orden** (así no hay alarmas duplicadas bajo concurrencia); publica un evento de Spring; el listener **asíncrono**, tras el commit, envía el correo y registra la fecha de envío (patrón `UserEvent`/`UserEventListener` y `AsyncSpringEventsConfig` de la cátedra) |
| T5 | Endpoints en `Constants` + controller: `GET /alarms`, `POST /alarms/{id}/acknowledge` (`{ observation }`), `GET` y `PUT /alarms/config`; Swagger completo; `@PreAuthorize` según la matriz |
| T6 | Tests con Mockito: se crea una sola alarma; no hay segunda hasta la aceptación; tras aceptar, vuelve a alarmar; destinatarios vacíos no rompen; un fallo del correo no rompe la lectura; umbral inválido da 400 |
| T7 | Concurrencia: 50 lecturas simultáneas sobre el umbral dejan **una** alarma y **un** correo |
| T8 | Postman: carpeta `09 - Alarmas` (configurar, superar el umbral, listar, aceptar, no reenvío, 403 por rol) |
| T9 | Prueba real del envío: el usuario provee una cuenta SMTP (Gmail con clave de aplicación) por variable de entorno; se envía un correo real a un destinatario de prueba |
| T10 | `docs/fase-N-alarmas.md` (informe + guía de defensa) |

**Criterios:** el correo llega una sola vez; no se reenvía hasta aceptar; la alarma queda con usuario, fecha y observación;
la lectura nunca falla por el correo; sin duplicados bajo concurrencia; el circuito 1 → 4 de Postman sigue sin fallas.
**Pasos manuales con autorización:** credenciales SMTP en la VM (variables de `~/infra`, fuera del repo).

### 4.3 Fase 3 — Ajustes de contrato para el frontend y cierre del backend

| Tarea | Detalle |
|---|---|
| T1 | `GET /orders` con filtro opcional `status` y orden elegible de una lista permitida (`orderNumber`, `plannedLoadDateTime`, `status`), manteniendo la paginación y el tope de 100. Consigna 4b: "filtros y ordenamiento por estado u otros criterios" |
| T2 | **(Aprobado)** endurecimiento mínimo H-5: clave JWT y orígenes CORS tomados de variables de entorno con el valor actual como respaldo, para no romper el despliegue; documentar cómo definirlas en la VM (paso manual con autorización). **Incluye H-30 (hallazgo de la Fase 0):** hoy el preflight de CORS (`OPTIONS`) responde 401 porque falta `http.cors()` en `SecurityConfiguration`; sin esto el navegador no puede llamar a la API desde otro origen. Se corrige con un `CorsConfigurationSource` (orígenes, métodos y cabeceras `Authorization`/`Content-Type`) y se verifica con un `OPTIONS` real, además de un test |
| T3 | Congelar el contrato: `docs/contrato-api.md` generado desde `/v3/api-docs` (copiado a este repo) |
| T4 | Regresión completa: `./mvnw -B test`, newman con las carpetas 00 a 09 |
| T5 | PR(s) del backend en *draft* (sin push hasta que el usuario lo pida) y plan de despliegue en la VM |
| T6 | `docs/fase-N-cierre-backend.md` |

**Criterios:** el filtro y el orden se prueban con Postman y tests; la regresión pasa; el contrato congelado coincide con Swagger.

---

## BLOQUE B — Frontend (este repo, ramas `fase-N-<tema>` desde `main`)

### 4.4 Fase 4 — Conexión real: cliente HTTP, tipos y errores

> **Estado (12/11/2026): integrada en `main` (PR #4) y desplegada**. T1 a T6 hechas. 83 tests (también con Node 22), lint y build en verde, tipos contrastados con el JSON del backend vivo y 33 verificaciones con Chrome real. La prueba con Chrome encontró un defecto que los tests no veían (el login real viene como `application/json` con el token pelado) y que explica por qué el login de la UI vieja siempre caía al mock. Informe: `docs/fase-4-conexion.md`.

| Tarea | Detalle |
|---|---|
| T1 | `NEXT_PUBLIC_API_URL` sin respaldo silencioso; `.env.example` documentado (el `.env.local` no se sube) |
| T2 | Reescribir los tipos en `src/types` según el contrato real (`Order`, `Truck`/`TruckTank`, `Driver`, `Customer`, `Product`, `OrderDetail`, `Reconciliation`, `Page<T>`, `StatusLog`, `Alarm`, `AlarmConfig`, `ApiErrorBody`) |
| T3 | `client.ts`: error por estado (401, 403, 404, 409, 302, 500, red caída), mensaje real del backend, 401 → evento de cierre de sesión; manejo del **302** de SAP (un `fetch` no lo trata como éxito) |
| T4 | Un helper para paginados y otro para la zona horaria (fechas sin offset interpretadas como hora de Argentina) |
| T5 | Pruebas unitarias del cliente (errores) y de los helpers; ampliar el script `npm test` |
| T6 | `docs/fase-4-conexion.md` |

**Criterios:** ningún tipo del frontend contradice el JSON real (verificado con respuestas reales del backend local); el cliente
distingue y comunica cada código; lint, test y build pasan. Los `*Api.ts` de cada feature se migran en su fase.

### 4.5 Fase 5 — Autenticación, sesión, rutas protegidas y roles en la UI

> **Estado (12/11/2026): integrada en `main` (PR #5) y desplegada**. T1 a T7 hechas. 116 tests (33 nuevos), 5 mutaciones detectadas, lint y build en verde y 95 verificaciones con Chrome real contra el backend (login, vencimiento, 401 y los 6 roles). Las pantallas de órdenes y alarmas siguen siendo las heredadas (listas vacías con el backend real) hasta las Fases 6 y 8. Informe: `docs/fase-5-autenticacion.md`.

| Tarea | Detalle |
|---|---|
| T1 | `authApi`: solo login real (`POST /login`); eliminar el JWT falso y el modo demo; mostrar el mensaje 401 del backend |
| T2 | `AuthContext`: sin usuario ni token por defecto; restaurar la sesión validando `exp`; cerrar sesión por 401 y por expiración |
| T3 | Protección de rutas: guard en el layout del dashboard que redirige a `/login` (y de `/login` al dashboard si ya hay sesión) |
| T4 | Login: quitar los accesos rápidos de demostración y las credenciales por defecto |
| T5 | Roles en la UI: tipo `UserRole` con los 6 roles; `RoleGuard`/`hasRole` aplicados a navegación y acciones según la matriz; pantalla/mensaje "sin permisos" para el 403; navbar con usuario, rol y cierre de sesión |
| T6 | Pruebas: parseo de JWT, expiración, `hasRole` |
| T7 | `docs/fase-5-autenticacion.md` |

**Criterios:** sin sesión no se ve ninguna pantalla del dashboard; credenciales incorrectas muestran el error real; un usuario por rol
ve solo lo que le corresponde (verificado con los usuarios sembrados); el 403 de la API no rompe la sesión.

### 4.6 Fase 6 — Órdenes: listado, filtros, monitoreo, detalle, ETA y tiempo transcurrido (consigna 4b, 4c, 4d)

> **Estado (12/11/2026): integrada en `main` (PR #6) y desplegada**. T1 a T9 hechas, salvo la **búsqueda por texto de T2**: el backend no la ofrece y hacerla en el cliente solo miraría la página actual (queda como limitación, decisión F-2). 127 tests, 5 mutaciones y 93 verificaciones con Chrome real. Informe: `docs/fase-6-ordenes.md`.

| Tarea | Detalle |
|---|---|
| T1 | `ordersApi` real: listado paginado con `status` y orden; detalle por `orderNumber`; rutas `/orders/[orderNumber]` |
| T2 | Listado: número, estado, camión (patente), preset, carga actual, últimas temperatura, densidad y caudal; filtro por estado, búsqueda y orden; paginación; estados de carga, vacío y error; polling con pausa en pestaña oculta |
| T3 | Dashboard (`/`): indicadores reales (órdenes por estado, en carga, alarmas pendientes) |
| T4 | Detalle: cabecera, pesajes (sin PIN, D-6), medidores, barra de carga, camión con cisternas, chofer, cliente y producto |
| T5 | **ETA** = (preset − masa acumulada) / caudal con los datos reales; casos de borde (caudal 0, carga completa, sin lecturas) |
| T6 | **Tiempo transcurrido** desde `loadingStartDateTime`, **solo en estado 2**, corrigiendo la zona horaria; en otros estados no se muestra como "en curso" |
| T7 | Historial de estados (`status-log`) como línea de tiempo y lecturas guardadas (`details`) en tabla o gráfico simple |
| T8 | Botón "Cerrar orden" (solo estado 2 y con el rol permitido) contra el endpoint real; confirmación y manejo de 409 |
| T9 | Pruebas de ETA, tiempo transcurrido y adaptadores; `docs/fase-6-ordenes.md` |

**Criterios:** con el backend real y el simulador (o Postman) corriendo una carga, el listado y el detalle se actualizan solos;
el ETA y el tiempo transcurrido coinciden con un cálculo manual; el tiempo transcurrido no aparece en estados 1, 3 y 4.

### 4.7 Fase 7 — Conciliación (consigna 4f)

> **Estado (13/11/2026): integrada en `main` (PR #7) y desplegada**. T1 a T5 hechas. 139 tests (12 nuevos), lint y build en verde. Conexión a `GET /orders/{orderNumber}/reconciliation` combinada con `getOrder` para remito imprimible, cálculo seguro de porcentaje derivado y manejo de 409. Informe: `docs/fase-7-conciliacion.md`.

| Tarea | Detalle |
|---|---|
| T1 | `reconciliationApi` real (`/orders/{n}/reconciliation`); combinar con la orden para mostrar patente, chofer, cliente y producto |
| T2 | Mostrar tara, pesaje final, producto cargado, neto por balanza, diferencia y promedios; el **porcentaje** se calcula en el frontend (`difference / scaleNet`) y se rotula como valor derivado |
| T3 | Acceso **solo en estado 4**: el botón aparece solo ahí y la ruta maneja el 409 de forma clara |
| T4 | Orden sin lecturas (`loadedProduct = 0`, promedios `null`): mostrar "sin datos", no `0` ni `NaN` |
| T5 | Ticket imprimible; pruebas de las métricas derivadas; `docs/fase-7-conciliacion.md` |

**Criterios:** los valores coinciden con la respuesta del backend y con un cálculo manual; órdenes en estados 1 a 3 no permiten ver la conciliación.

### 4.8 Fase 8 — Alarmas en la UI (consigna 4e)

> **Estado (13/11/2026): integrada en `main` (PR #7) y desplegada**. T1 a T6 hechas. 152 tests (13 nuevos de validación), lint con 1 sola advertencia (legacy), build en verde. Consumo real de los 4 endpoints de `/alarms`, banner global, modal de aceptación sin username en payload (D-5), visualización de `emailSentAt` y formulario de configuración con validación estricta. Informe: `docs/fase-8-alarmas.md`.

| Tarea | Detalle |
|---|---|
| T1 | `alarmsApi` real: listado, aceptar, configuración |
| T2 | Banner global de alarmas pendientes y contador en la navegación |
| T3 | Tabla de alarmas con filtro por estado, enlace a la orden, y usuario, fecha, hora y observación de la aceptación |
| T4 | Modal de aceptación con observación opcional; el usuario sale del token (D-5); visible solo para roles autorizados |
| T5 | Formulario de configuración (umbral y lista de correos con validación) solo para `ADMIN`; `SUPERVISOR` lo ve en lectura |
| T6 | Pruebas de validación de correos y umbral; `docs/fase-8-alarmas.md` |

**Criterios:** al superar el umbral en una carga real aparece la alarma sin recargar y llega un único correo; tras aceptarla se registra quién y cuándo;
un rol no autorizado no ve el botón de aceptar y, si lo fuerza, recibe un 403 comprensible.

### 4.9 Fase 9 — Simulador de integración real

> **Estado (13/11/2026): integrada en `main` (PR #7) y desplegada**. T1 a T7 hechas. 162 tests, lint sin advertencias y build en verde; **70 verificaciones en Chrome contra Spring Boot y MySQL locales**, con circuito completo, errores 302/400/403, alarma y correo capturado por SMTP local, conciliación y restricción de los cinco roles sin ADMIN. Se eliminaron el mock y los tipos heredados. La entrega del correo a una casilla externa y la prueba en la VM siguen pendientes para el cierre. Informe: `docs/fase-9-simulador.md`.

**Objetivo:** que el simulador recorra el circuito real (Puntos 1 a 5) para la demostración, hablando con los endpoints verdaderos.

| Tarea | Detalle |
|---|---|
| T1 | SAP: formulario con el cuerpo real (códigos externos, camión con cisternas, chofer, cliente, producto, fecha prevista, preset); manejo del 302 (orden repetida) y del 400 con sus mensajes |
| T2 | TMS tara: `{ weight }` → muestra el **PIN** devuelto (único lugar donde aparece) |
| T3 | Sistema de carga: activación `{ orderNumber, password }` (muestra el 403 si es incorrecta) → devuelve el preset; envío de lecturas con progreso y control de temperatura; mostrar `saved` / `reason`; cierre |
| T4 | TMS pesaje final `{ weight }` → muestra la conciliación devuelta |
| T5 | Habilitado solo para `ADMIN`; rotulado como herramienta de demostración |
| T6 | Eliminar `mockStore.ts` y todo `catch` de respaldo restante (D-7) |
| T7 | `docs/fase-9-simulador.md`; recorrido completo 1 → 4 desde la UI, con alarma incluida |

**Criterios:** el circuito completo se recorre solo desde la interfaz contra el backend real; cada respuesta de error del backend se ve tal cual; no queda ninguna referencia al mock.

### 4.10 Fase 10 — Calidad, despliegue y ensayo de defensa

> **Estado (13/11/2026): implementada y probada en lo que no toca la VM** (rama `fase-10-calidad`). Hechas T1, T2, T6 y T7; de T3 solo el análisis de la configuración. **T4 y T5 (variables y prueba de punta a punta en la VM) quedan pendientes** por decisión del usuario. 181 tests, axe-core sin violaciones, guía de estudio con 28 preguntas. Informe: `docs/fase-10-calidad.md`.

| Tarea | Detalle |
|---|---|
| T1 | Revisión transversal: sin `any`, sin advertencias de lint, estados de carga/vacío/error en todas las pantallas, responsive, accesibilidad básica |
| T2 | Pruebas: ampliar `npm test`; el CI ya corre lint y tests en cada PR |
| T3 | Despliegue: comprobar el pipeline del frontend contra la VM real (el `Dockerfile` fija `NEXT_PUBLIC_API_URL` al compilar y el valor por defecto del workflow apunta a `http://143.0.100.187:8080`, mientras el backend se sirve por `https://jc755.duckdns.org`: verificar CORS y contenido mixto antes de tocar nada) |
| T4 | Variables y datos en la VM (SMTP, roles y usuarios): con autorización y fuera del repo |
| T5 | Prueba de punta a punta **en la VM**: login por rol, circuito 1 → 4, alarma con correo, conciliación |
| T6 | `README.md` actualizado y guía de estudio completa (flujo punto por punto de cada fase y preguntas de defensa) |
| T7 | Ensayo de defensa: preguntas cruzadas entre backend, frontend, roles y alarmas |

**Criterios:** el sistema desplegado pasa la prueba de punta a punta; la guía cubre todas las fases; el equipo puede explicar cada flujo.

## 5. Matriz de cobertura: nada queda sin tocar

**Frontend heredado → fase que lo resuelve**

| Archivo o grupo | Fase |
|---|---|
| `services/api/client.ts`, `types/*` | 4 |
| `features/auth/*`, `app/(auth)/login`, `app/layout.tsx`, `components/shared/{role-guard,navbar,sidebar}` | 5 |
| `app/(dashboard)/layout.tsx` | 5 (guard) y 8 (banner de alarmas) |
| `features/orders/*`, `app/(dashboard)/{page,orders/page,orders/[id]/page}`, `state-badge` | 6 |
| `lib/calculations.ts` y su test, `lib/formatters.ts`, `components/ui/*` | 4 (helpers), 6 (cálculos), 10 (revisión) |
| `features/reconciliation/*`, `orders/[id]/reconciliation` | 7 |
| `features/alarms/*`, `app/(dashboard)/alarms` | 8 |
| `features/simulator/*`, `app/(dashboard)/simulator`, `services/mock/mockStore.ts` | 9 |
| `next.config.ts`, `Dockerfile`, `.github/workflows`, `README.md`, `.env.example` | 0 (verificar), 4 (env), 10 (despliegue) |

**Backend → fase**

| Endpoint o pieza | Fase |
|---|---|
| Los 13 endpoints actuales: roles (`@PreAuthorize`) | 1 |
| `status-log` y `details` (hoy sin uso en el frontend) | 6 |
| Alarmas, configuración, correo, eventos | 2 |
| Filtro y orden del listado; contrato congelado; H-5 opcional | 3 |
| Postman (carpetas 08 y 09), tests, seeds | 1, 2, 3 |

**Consigna del final → fase:** punto 1 (100 % endpoints) ya hecho · punto 2 (roles) 1 y 5 · punto 3 (alarma por correo) 2 y 8 · punto 4a (autenticación) 5 ·
4b (monitoreo, filtros y orden) 3 y 6 · 4c (ETA) 6 · 4d (tiempo transcurrido, solo estado 2) 6 · 4e (alarmas) 8 · 4f (conciliación, solo estado 4) 7.

## 6. Riesgos conocidos

| Riesgo | Mitigación |
|---|---|
| El correo no sale (credenciales, bloqueo de Gmail, red de la VM) | Probarlo temprano (Fase 2, T9); la lectura no depende del correo; dejar el `emailSentAt` visible |
| El mock oculta errores durante el desarrollo | Eliminarlo por fases (D-7); toda prueba se hace contra el backend real |
| Zona horaria: el backend envía hora de Argentina sin offset | Helper único (Fase 4) y prueba unitaria |
| **CORS: el preflight devuelve 401 (H-30, medido el 12/11/2026)**; además contenido mixto entre el frontend y la API en la VM | Corregir en la Fase 3, T2 (`http.cors()`); verificar con `OPTIONS` real y desde el navegador al iniciar la Fase 4; revisar el despliegue en la VM (Fase 10, T3) |
| Next.js 16.4 y su configuración (`cacheComponents`, `partialPrefetching`, plugin de Tailwind) | Medido en la Fase 0: compila y genera las 10 rutas sin errores. Consultar la documentación incluida en `node_modules` antes de usar APIs de Next |
| **`next@16.4.0` tiene 3 avisos de seguridad** (`npm audit`, 12/11/2026): 2 de ejecución remota de código (optimización de imágenes con SVG y `use cache` con *typed arrays*) y 1 de denegación de servicio (Server Actions); el corrector propone `16.4.6`. El proyecto no usa `next/image` con SVG ni Server Actions, pero la versión se publica en la VM | **Resuelto el 12/11/2026:** actualizado a `next@16.4.6` y `eslint-config-next@16.4.6` (versión exacta); `npm audit` ya no marca `next`; lint, test y build igual que antes. Quedan 7 avisos moderados de `minimatch` solo en desarrollo |
| Merge a `main` redespliega solo (ambos repos) | Ningún merge sin autorización; despliegue verificado con la prueba de punta a punta |
| Aprobaciones de PR (3 de 4) no exigidas por GitHub | Se cumplen a mano; abrir los PR como *draft* |

## 7. Decisiones del usuario (12/11/2026)

| # | Tema | Decisión |
|---|---|---|
| 1 | Matriz de roles (sección 4.1) | **Aprobada** tal como está |
| 2 | Alcance de la alarma | **Por orden** (D-3), umbral y destinatarios globales |
| 3 | H-5 (clave JWT y CORS por variables de entorno) | **Entra** en el final (Fase 3, T2 ya no es opcional) |
| 4 | Actualizar Next.js a `16.4.6` | **Hecho en la Fase 0** (antes que en la Fase 4), a pedido del usuario |
| 5 | Cuenta SMTP | **Más adelante**: se pone cuando el correo esté hecho y se esté probando (Fase 2, T9) |
| 6 | Fecha del final y reparto de fases | **Sin definir.** Por ahora avanza solo Martín González, con más libertad en el ritmo; se reparte cuando quiera terminar |

La regla de "una fase por vez con autorización" se mantiene, pero el ritmo es flexible: una fase puede abrirse sin ceremonia si el usuario lo pide.
