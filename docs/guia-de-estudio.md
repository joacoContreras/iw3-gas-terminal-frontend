# Guía de estudio y ensayo de defensa

Para preparar la defensa del examen final (Ingeniería Web III, 2026). La evaluación es **individual** y exige explicar **todo** el sistema: el backend, el frontend y cómo se hablan. Esta guía junta lo que está repartido en los informes y los recorre **punto por punto**, con el archivo donde ocurre cada paso.

**Cómo usarla:** leé la sección 1 (el mapa), recorré cada flujo de la sección 3 con el código abierto, practicá la demostración de la sección 5 y contestá en voz alta las preguntas de la sección 6 sin mirar las respuestas. Los informes por fase tienen el detalle y sus propias guías de defensa.

| Para profundizar en… | Leer |
|---|---|
| Backend heredado (Puntos 1 a 5, modelo, metodología de la cátedra) | `iw3-gas-terminal-backend/docs/guia-estudio-src.md` y `docs/fase-1…5` del backend |
| Roles, alarmas por correo, CORS y contrato (backend del final) | `docs/final-fase-1-roles.md`, `final-fase-2-alarmas.md` y `final-fase-3-cierre-backend.md` del backend |
| Contrato exacto de la API (rutas, roles, ejemplos reales) | `docs/contrato-api.md` (este repo) |
| Frontend, fase por fase | `docs/fase-4-conexion.md` a `docs/fase-9-simulador.md` |
| Estado de la verificación de `main` | `docs/verificacion-main-13-11-2026.md` |

---

## 1. El mapa del sistema

```
 SAP ──────────┐                       ┌─────────────────────────────────────────────┐
 Balanza (TMS) ┼─ POST /integration/* ─▶│  BACKEND  (Spring Boot 4.1, Java 21, MySQL)  │
 Sist. de carga┘   (token con rol de    │  JWT · @PreAuthorize · CORS · Spring events  │
                    cada sistema)       │  Business (I*Business + *Business)           │──▶ correo (SMTP)
                                        └───────────────▲─────────────────────────────┘
                                                        │ HTTP + JWT (Bearer)
                                        ┌───────────────┴─────────────────────────────┐
 Personas: ADMIN, SUPERVISOR, OPERADOR ─▶│  FRONTEND (Next.js 16, React 19, TypeScript) │
 (navegador)                            │  localStorage(JWT) · polling · UI por rol    │
                                        └─────────────────────────────────────────────┘
```

- **Dos repositorios, una sola frontera: HTTP.** El frontend no importa nada del backend; solo conoce el contrato (`docs/contrato-api.md`) y la variable `NEXT_PUBLIC_API_URL`.
- **El backend es la fuente de verdad.** El frontend se adapta al contrato, no al revés; lo que la interfaz oculta lo vuelve a decidir el backend (403).
- **Los estados de la orden** (`status`, número): 1 pendiente de pesaje inicial → 2 con pesaje inicial registrado (llegan las lecturas) → 3 cerrada para carga → 4 finalizada. Son secuenciales y unidireccionales.

### Qué pide la consigna y dónde se cumple

| Consigna | Backend | Frontend |
|---|---|---|
| Roles que regulen el consumo de las APIs | `@PreAuthorize` en cada endpoint; matriz en el contrato | `features/auth/lib/permissions.ts`, `PermissionGate`, `AuthGate` |
| Alarma de temperatura por e-mail (umbral y destinatarios configurables, sin reenvío hasta que la acepta alguien autorizado) | `AlarmBusiness`, `AlarmConfigBusiness`, `TemperatureAlarmEventListener`, `EmailBusiness` | `features/alarms/*` |
| Autenticación | `POST /login`, `JWTAuthorizationFilter` | `features/auth/*` |
| Monitoreo en tiempo real, filtros y orden | `GET /orders?status=&sort=` | `features/orders/*`, `lib/use-polling.ts` |
| ETA y tiempo transcurrido (solo estado 2) | datos de la orden (`last*`, `loadingStartDateTime`) | `features/orders/lib/order-metrics.ts`, `lib/dates.ts` |
| Gestión de alarmas (ver, aceptar, usuario, fecha, observación) | `POST /alarms/{id}/acknowledge` | `features/alarms/components/alarm-ack-modal.tsx` |
| Conciliación (solo estado 4) | `GET /orders/{n}/reconciliation` | `features/reconciliation/*`, `lib/calculations.ts` |

---

## 2. Reglas de oro (si solo te acordás de esto)

1. **Ocultar un botón no es seguridad.** La interfaz oculta por comodidad; cada endpoint tiene `@PreAuthorize` y responde 403 aunque se llame con `curl`.
2. **El frontend no puede verificar la firma del JWT** (la clave es del backend). Lee `exp` y `roles` solo para la interfaz; si el token es falso, el primer pedido da 401 y la sesión se cierra.
3. **401 ≠ 403.** 401: no hay sesión válida (cerrar y volver al login). 403: hay sesión pero el rol no alcanza (mostrar «sin permisos», sin cerrar).
4. **Un dato inexistente no es cero.** Una orden sin lecturas muestra «—», no «0 °C».
5. **El tiempo transcurrido es solo del estado 2**, y se calcula con la hora de Argentina que manda el backend (fechas sin zona).
6. **El correo nunca frena una lectura.** Sale después del `commit`, en otro hilo; si falla, la lectura ya está guardada.
7. **El usuario que acepta una alarma sale del token, no del cuerpo** (no se puede falsear).
8. **Sin mock, sin tokens falsos, sin `catch` que esconda errores.** Cada error se muestra con el mensaje real del backend (nunca `devInfo`).

---

## 3. Los flujos, punto por punto

### 3.1 Login y sesión

1. `app/(auth)/login/page.tsx`: el formulario (vacío, sin credenciales por defecto) llama a `login(usuario, clave)` del contexto.
2. `features/auth/services/authApi.ts` → `apiClient("/login", { form, auth: false })` → `POST /api/v1/login` (formulario `username` y `password`, sin token).
3. Backend: `auth/controller/AuthRestController` → `CustomAuthenticationManager` valida contra `UserBusiness` (BCrypt) → responde el JWT **como texto** (HS512, 1 hora; claims `sub`, `roles`, `email`, `version`, `exp`).
4. `features/auth/lib/session.ts` (`sessionFromToken`): decodifica el payload, exige `sub` y `exp` y que no esté vencido. Si no sirve, error y no se guarda nada.
5. `features/auth/context/AuthContext.tsx`: guarda **solo el token** en `localStorage` (`iw3_auth_token`), arma el usuario y programa un temporizador al `exp`.
6. La sesión termina por: botón «Cerrar sesión», vencimiento (temporizador, y `visibilitychange` al volver de la suspensión), 401 del backend (evento `iw3:unauthorized` que dispara `services/api/client.ts`) o cierre desde otra pestaña (evento `storage`).
7. Al recargar, el contexto restaura la sesión **validando `exp`**; un token ilegible o vencido se borra.

### 3.2 Un pedido protegido y cómo lo ve cada rol

1. `features/auth/components/auth-gate.tsx` (en `app/(dashboard)/layout.tsx`): sin sesión redirige a `/login`; es reactivo porque un layout no se vuelve a renderizar al navegar.
2. Cada pantalla pide permiso: `orders/layout.tsx`, `alarms/layout.tsx` y `simulator/layout.tsx` usan `RequirePermission`; los botones, `PermissionGate`. La tabla `PERMISSIONS` de `permissions.ts` es un espejo de la matriz del contrato y **un test la compara con `docs/contrato-api.md`**.
3. `apiClient` agrega `Authorization: Bearer <token>`.
4. Backend: `JWTAuthorizationFilter` verifica firma y vencimiento y arma las autoridades `[ROLE_…]`; luego el proxy evalúa `@PreAuthorize(...)` **antes** de entrar al método del controller.
5. Respuestas: sin token o vencido → **401** JSON (`RestAuthenticationEntryPoint`, sin `WWW-Authenticate` para que el navegador no abra el diálogo); rol insuficiente → **403** JSON (`RestAccessDeniedHandler`).
6. El cliente HTTP convierte todo en `ApiError(status, message)`: 401 con token enviado cierra la sesión; 403 no la cierra.

| Rol | Puede |
|---|---|
| ADMIN | Todo: órdenes, alarmas, aceptar, **editar** la configuración, simulador |
| SUPERVISOR | Ver y cerrar órdenes, ver y **aceptar** alarmas, ver (no editar) la configuración |
| OPERADOR | Ver y cerrar órdenes, ver alarmas (no aceptarlas) |
| SAP, TMS, LOADER | Son sistemas externos: solo sus endpoints de integración; sin pantallas |
| USER | Puede iniciar sesión pero no tiene permisos |

### 3.3 CORS (por qué el navegador pudo hablar con la API)

1. El navegador, desde `http://localhost:3000`, va a hacer `GET /orders` con `Authorization`. Ese header dispara CORS: antes manda `OPTIONS /orders` **sin token**.
2. Backend: `security/SecurityConfiguration` tiene `http.cors()` **antes** de la autorización, con `CorsConfigurationSource` (orígenes de `CORS_ALLOWED_ORIGINS`, por defecto `*`). Responde 200 con `Access-Control-Allow-*`.
3. Recién ahí viaja el `GET` real. El 401 también lleva cabeceras CORS: si no, el navegador lo ocultaría y el frontend no podría cerrar la sesión.
4. Antes (H-30) el preflight caía en el 401 porque la configuración era un mapeo de Spring MVC, que corre **después** de la autorización.

### 3.4 El circuito de la carga (Puntos 1 a 5)

| Paso | Quién | Llamada | Resultado |
|---|---|---|---|
| 1 | SAP | `POST /integration/sap/orders` | 201; la orden nace en **estado 1**. Si el número existe: **302** (convención de la cátedra) |
| 2 | Balanza (TMS) | `POST /integration/tms/orders/{n}/tare` `{weight}` | **Estado 2**; devuelve la **contraseña de activación** de 5 dígitos (única vez que se ve) |
| 3a | Sistema de carga | `POST /integration/loader/activation` `{orderNumber, password}` | 200 con el `preset`; 403 si la clave es incorrecta |
| 3b | Sistema de carga | `POST /integration/loader/orders/{n}/details` | Siempre 200 `{saved, reason}`; una lectura inválida se **descarta** (caudal ≤ 0, masa ≤ 0 o menor que la última, densidad fuera de 0–1) |
| 4 | Sistema de carga o persona | `POST /integration/loader/orders/{n}/close` | **Estado 3**; 409 si no estaba en 2 |
| 5 | Balanza (TMS) | `POST /integration/tms/orders/{n}/final-weight` | **Estado 4**; devuelve la conciliación; 400 si el peso es menor que la tara |

En el backend cada paso es `controller → IOrderBusiness/OrderBusiness → repositorio`, con el `try/catch` del controller, `StandartResponse` y las constantes en `Constants` (metodología de la cátedra). Las lecturas bloquean la orden (`PESSIMISTIC_WRITE`) para que lecturas simultáneas no se pisen. El frontend **no** crea órdenes: lo hace el simulador (admin) o los sistemas externos.

### 3.5 Lectura caliente → alarma → correo → aceptación

1. Llega `POST …/details` con temperatura mayor que el umbral (estricto: `>`).
2. `OrderDetailBusiness.add` guarda la lectura y actualiza la cabecera de la orden en una transacción.
3. `AlarmBusiness.evaluate` (dentro de un `try/catch` propio): si no hay una alarma **PENDING** de esa orden, la inserta y publica `TemperatureAlarmEvent`. **Una pendiente por orden** (D-3): lecturas calientes siguientes no crean otra ni mandan otro correo.
4. La transacción se confirma; el caudalímetro recibe `200 {saved:true}`.
5. `TemperatureAlarmEventListener` (`@TransactionalEventListener(AFTER_COMMIT)` + `@Async`) manda **un correo por destinatario** con `EmailBusiness` y, si salió al menos uno, marca `emailSentAt` con un `UPDATE` puntual. Si falla, queda registrado y la lectura no se pierde.
6. Frontend: `features/alarms/hooks/useAlarms.ts` consulta cada pocos segundos (solo si el rol puede ver alarmas); `dashboard-shell.tsx` muestra el **banner global** y la campana con el contador.
7. Aceptar: `alarm-ack-modal.tsx` (ADMIN o SUPERVISOR) → `POST /alarms/{id}/acknowledge` con **solo** `{observation}` (máx. 500). El backend toma el usuario del token y guarda quién, cuándo y la observación.
8. Segunda aceptación de la misma alarma → 409. Tras aceptar, una **nueva** superación vuelve a alarmar.
9. Configuración: `GET /alarms/config` (ADMIN y SUPERVISOR) y `PUT /alarms/config` (solo ADMIN); el formulario valida umbral finito, correos válidos, sin repetidos y hasta 20.

### 3.6 Monitoreo en tiempo real

1. `lib/use-polling.ts`: pide el dato, y recién cuando termina programa el siguiente (`setTimeout` encadenado, **sin pedidos superpuestos**); se pausa con la pestaña oculta y pide de inmediato al volver; cancela con `AbortController` al desmontar; un fallo **conserva el último dato** y muestra el aviso.
2. Listado (`orders/page.tsx`, `useOrders`): estado, orden y página se mandan **al servidor** (`GET /orders?status=&sort=campo,dirección&page=&size=`); si se filtrara en el navegador solo se vería la página actual.
3. Detalle (`orders/[orderNumber]/page.tsx`): `useOrder` cada 2 s mientras `status === 2`, cada 10 s en otros estados; historial de estados y lecturas guardadas en hooks aparte.
4. **ETA** (`features/orders/lib/order-metrics.ts`): `(preset − masa acumulada) / caudal`, en segundos, con casos de borde con nombre: no está en carga, sin lecturas, completa, caudal cero.
5. **Tiempo transcurrido** (`lib/dates.ts` → `loadingElapsedMillis`): solo estado 2, desde `loadingStartDateTime`; `parseBackendDate` le agrega `-03:00` para no depender de la zona del navegador; nunca da negativo.
6. Cerrar la orden (`close-order-button.tsx`): solo estado 2, roles permitidos, con confirmación; un 409 muestra el mensaje real y se vuelve a leer la orden.

### 3.7 Conciliación (solo estado 4)

1. Botón «Conciliación» o `/orders/{n}/reconciliation` → `useReconciliation` → `GET /orders/{n}/reconciliation`.
2. Backend (`business/Reconciliation`): **se calcula en cada consulta** (no se guarda): `neto por balanza = pesaje final − tara`; `producto cargado` = última masa acumulada; `diferencia = neto − producto cargado`; promedios de temperatura, densidad y caudal de las lecturas guardadas. En cualquier otro estado → **409**.
3. Frontend (`lib/calculations.ts`): calcula el **porcentaje** `diferencia / neto × 100` (el backend no lo manda) y lo compara con una tolerancia (1 %). Muestra el remito imprimible.
4. Si la orden no está en estado 4, se muestra el mensaje del backend (409) y un enlace al detalle.

### 3.8 Simulador (solo ADMIN)

1. `features/simulator/*`: recorre desde la interfaz el circuito de la sección 3.4 contra el backend real, con los mismos endpoints que usarían los sistemas externos.
2. El PIN de activación se ve **solo** en la respuesta de la tara (el `GET` de la orden no lo publica, D-6).
3. El bombeo automático convierte el caudal (kg/h) en masa por intervalo (`features/simulator/lib/simulation.ts`); los controles impiden envíos superpuestos y la masa nunca baja (una lectura menor se descartaría).
4. Subir la temperatura sobre el umbral dispara el flujo de alarma de la sección 3.5.

---

## 4. Decisiones de diseño que te pueden preguntar

| # | Decisión | Por qué |
|---|---|---|
| D-3 | Una alarma pendiente por orden; umbral y destinatarios globales | Dos órdenes calientes avisan las dos; una misma no inunda de correos |
| D-4 | Un fallo del correo nunca hace fallar la lectura | El caudalímetro debe recibir 200 |
| D-5 | El usuario que acepta sale del token | No se puede falsear |
| D-6 | El PIN no se publica en el detalle | Solo lo ve quien registra la tara |
| D-7 | Sin mock ni `catch` que caiga a datos falsos | El mock ocultaba errores y mostraba datos de mentira |
| D-8 | Tiempo real por *polling* | El backend no tiene WebSockets ni SSE y la cátedra tampoco los enseña |
| D-10 | Clave JWT y CORS por variables de entorno, con respaldo | Seguridad sin romper el despliegue vigente |
| R-1 | `@PreAuthorize` en cada método, no reglas por URL | Es lo que enseña la cátedra y deja el permiso junto al endpoint |
| F-1 | Filtro, orden y paginación en el servidor | Con paginación, filtrar en el navegador mentiría |
| C-3 | El cliente no verifica el JWT | No puede: la clave es del backend |

---

## 5. Demostración de 10 minutos (guion)

Prerrequisito: backend y MySQL levantados (perfil `mysqldev`) y `npm run dev` o el sitio desplegado. Usuarios de desarrollo (`docs/sql/seed-dev-users.sql` del backend): `admin / admin123`, y `supervisor`, `operador`, `sap`, `tms`, `loader` con contraseña `<usuario>123`.

1. **Sin sesión:** abrir `/orders` → redirige a `/login`. Contraseña mala → mensaje real del backend.
2. **Admin → simulador:** emitir una orden SAP (estado 1) → registrar la tara (aparece el PIN, estado 2) → validar el PIN → bombear con «+500 kg» (el cronómetro y la ETA empiezan a correr en el detalle, en otra pestaña, **sin recargar**).
3. **Alarma:** subir la temperatura por encima del umbral y enviar una lectura → banner rojo y campana; en el backend `emailSentAt` (o «Correo no enviado» si no hay SMTP). Enviar otra lectura caliente: **no** hay segunda alarma.
4. **Roles:** entrar como `operador` → ve la alarma pero **no** tiene «Aceptar»; entrar como `supervisor` → la acepta con una observación (queda su usuario, fecha y observación); mostrar que `operador` recibe 403 si lo intenta con `curl`.
5. **Cierre y conciliación:** cerrar la orden con confirmación (estado 3, el cronómetro se detiene) → pesaje final desde el simulador (estado 4) → conciliación con neto, cargado, diferencia y porcentaje, y el remito.
6. **Cierre del recorrido:** abrir `/simulator` como `supervisor` → «sin permisos».

---

## 6. Ensayo de defensa: preguntas cruzadas

Respondelas en voz alta. Entre paréntesis, dónde mirar.

**Roles y seguridad**

1. *¿Cómo se entera el backend de qué rol tiene quien llama?* El JWT trae el claim `roles`; `JWTAuthorizationFilter` verifica firma y vencimiento y arma las autoridades; `@PreAuthorize` las evalúa antes del método.
2. *¿Por qué el `try/catch` del controller no atrapa el 403?* Porque el proxy de `@PreAuthorize` lanza `AccessDeniedException` **antes** de entrar al método; la traduce `ExceptionTranslationFilter` → `RestAccessDeniedHandler` (JSON).
3. *Si oculto el botón «Aceptar», ¿está protegida la alarma?* Sí, pero por el backend: `@PreAuthorize` en el endpoint. El botón oculto es solo comodidad. Probalo con `curl` y el token de `operador`: 403.
4. *¿El frontend valida la firma del token?* No puede. Si alguien pone un token falso en `localStorage` ve la interfaz un instante, pero el primer pedido da 401 y se cierra la sesión.
5. *¿Dónde se guarda el JWT y qué riesgo tiene?* En `localStorage`; un XSS podría leerlo. La alternativa (cookie `HttpOnly`) exige que el backend la emita; hoy entrega el token en el cuerpo.
6. *¿Qué pasa cuando vence el token?* El backend responde 401; antes, el temporizador del contexto ya cerró la sesión. No hay *refresh*: hay que volver a entrar.
7. *Cambio `JWT_SECRET` en la VM, ¿qué pasa con los usuarios conectados?* Sus tokens dejan de valer (401) y deben volver a entrar.
8. *¿Por qué hay un 401 y un 403 distintos en la interfaz?* 401: la sesión ya no vale → login. 403: el rol no alcanza → «sin permisos», sin cerrar la sesión.

**Alarmas**

9. *Llegan 100 lecturas calientes seguidas de la misma orden, ¿cuántos correos salen?* Uno por destinatario, mientras la alarma esté pendiente (D-3); la comprobación ocurre dentro de la transacción con la orden bloqueada, así que ni siquiera lecturas simultáneas crean dos.
10. *¿Qué pasa si el servidor de correo está caído?* La lectura se guarda igual (`200 saved:true`); el correo falla en otro hilo, queda registrado y `emailSentAt` queda nulo; la interfaz lo muestra como «Correo no enviado». No se reintenta.
11. *¿Por qué el correo sale `AFTER_COMMIT`?* Para que si la transacción se revierte no salga un aviso de algo que no se guardó; y es `@Async` para que el caudalímetro no espere al SMTP.
12. *¿Quién puede configurar el umbral y los destinatarios?* Solo ADMIN (`PUT /alarms/config`); SUPERVISOR lo ve en solo lectura.
13. *¿Cómo sabe el sistema quién aceptó la alarma si el cuerpo no trae el usuario?* Lo toma del token (D-5), así no se puede falsear.

**Órdenes, ETA y tiempo**

14. *Dame la fórmula de la ETA y un caso de borde.* `(preset − masa acumulada) / caudal`; con caudal 0 no se divide: se muestra «Caudal cero»; sin lecturas, «Sin lecturas»; con la carga completa, «Completa».
15. *¿Por qué el tiempo transcurrido solo corre en el estado 2?* Es el tiempo desde el inicio de la carga mientras se carga; en 3 y 4 la carga terminó y seguir contando sería falso.
16. *La VM está en otra zona horaria, ¿se rompe el cronómetro?* No: el backend manda hora de Argentina sin zona y `parseBackendDate` le agrega `-03:00` (hay una prueba con tres zonas distintas).
17. *¿Cómo se actualiza la pantalla sin WebSockets?* *Polling* encadenado, sin superposición, con pausa si la pestaña está oculta (D-8).
18. *¿Por qué el filtro por estado lo hace el servidor?* Porque el listado está paginado: filtrar en el navegador solo vería la página actual.
19. *¿Qué pasa con una lectura con densidad 1,2?* El backend la descarta (`saved:false`, `reason`) con HTTP 200; no se guarda ni alarma.

**Conciliación y cierre**

20. *¿Cuándo hay conciliación?* Solo en estado 4; en otro estado el backend responde 409 y la interfaz muestra el mensaje.
21. *¿Quién calcula el porcentaje de diferencia?* El frontend (`diferencia / neto × 100`); el backend manda la diferencia en kg.
22. *¿Qué pasa si dos personas cierran la misma orden a la vez?* El primero la pasa al estado 3; el segundo recibe 409 y la interfaz muestra el mensaje y relee la orden.
23. *¿Por qué el pesaje final menor que la tara da 400?* No tiene sentido físico (neto negativo); el backend lo rechaza y la interfaz muestra su mensaje.

**Arquitectura**

24. *¿Por qué dos repositorios?* Se comunican solo por HTTP (contrato congelado en `docs/contrato-api.md`); ninguno compila ni importa código del otro.
25. *¿Qué pasa si el backend cambia un campo?* Los tipos de `@/types/api` y `contract-examples.ts` (JSON real tipado) hacen fallar `next build`, y `permissions.test.mjs` falla si cambia la matriz de roles.
26. *¿Cómo evitaron que vuelva el mock?* Se borró el código y `src/architecture.test.mjs` hace fallar el CI si reaparece, o si entra un `any`, un `console`, una credencial o un `fetch` fuera del cliente HTTP.
27. *¿Cómo se prueba contra el backend real?* Con Chrome automatizado y órdenes creadas por la API de integración; los resultados están en `docs/verificacion-main-13-11-2026.md`.
28. *¿Qué NO se probó?* El correo con una cuenta SMTP real, el recorrido completo en la VM y el aspecto visual en otros navegadores.

---

## 7. Qué debe poder explicar cada integrante

- El mapa de la sección 1 y la regla «ocultar no es seguridad».
- Los flujos 3.1, 3.2 y 3.5 sin mirar: login y sesión, un pedido con rol, y la alarma de punta a punta.
- La fórmula de la ETA, por qué el transcurrido es solo del estado 2 y cómo se evita el problema de zona horaria.
- Qué ve cada rol y de dónde sale esa tabla.
- Las limitaciones conocidas (sección siguiente), dichas con honestidad.

## 8. Límites conocidos (decilos vos antes de que te los pregunten)

- **Token en `localStorage`** (riesgo ante XSS) y **sin renovación**: dura una hora.
- **No hay búsqueda por texto** en el listado: el backend solo filtra por estado.
- **El correo no se reintenta** si falla, y no se probó con una cuenta SMTP real.
- **El despliegue en la VM** necesita, de forma manual y fuera del repositorio: `JWT_SECRET`, `CORS_ALLOWED_ORIGINS` (hoy abierto con `*`), los usuarios por rol y las credenciales SMTP.
- **Si el frontend se sirviera por HTTPS** y la API por HTTP, el navegador bloquearía los pedidos (contenido mixto); hoy ambos van por HTTP.
- **El ETA es lineal:** usa el caudal de la última lectura.
