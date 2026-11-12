# Fase 4 — Conexión real: cliente HTTP, tipos y errores

**Rama:** `fase-4-conexion` (desde `main`, `f73db4d`) · **Fecha:** 12/11/2026 · **Estado:** implementada, probada y pusheada (sin PR)
**Objetivo:** que el frontend deje de hablar con una API imaginada y use el contrato real del backend (`docs/contrato-api.md`), con errores claros y sin datos falsos.
**Regla 9 (Next 16):** antes de escribir código se leyó la guía `node_modules/next/dist/docs/01-app/02-guides/environment-variables.md`; condiciona el diseño (ver C-2).

## 1. Qué se hizo

| Tarea del plan | Resultado |
|---|---|
| T1 · URL sin respaldo silencioso | `NEXT_PUBLIC_API_URL` ya **no** cae a `http://localhost:8080`: sin ella el cliente falla con «Falta configurar NEXT_PUBLIC_API_URL». Se agregó `.env.example` (y la excepción en `.gitignore`, porque `.env*` lo habría ignorado) y la sección en el `README` |
| T2 · Tipos del contrato real | `src/types/api/` (`common`, `order`, `alarm`, `integration`, `auth`): `Order`, `Truck`/`TruckTank`, `Driver`, `Customer`, `Product`, `OrderReading`, `OrderStatusLog`, `Reconciliation`, `Page<T>`, `TemperatureAlarm`, `AlarmConfig`, los cuerpos de integración y los claims del JWT. Más `contract-examples.ts`: ejemplos **reales** tipados |
| T3 · Cliente HTTP | `src/services/api/client.ts` reescrito: `apiClient` y `apiRequest`, `ApiError(status, message)`, mensaje real del backend, `devInfo` nunca expuesto, 401 con sesión → evento de cierre, 403 sin cierre, red caída y tiempo agotado como estado 0, cancelación, y el **302** de SAP |
| T4 · Helpers | `src/lib/dates.ts` (fechas sin zona = hora de Argentina) y `src/lib/api-query.ts` (parámetros de `/orders` y `/alarms`, tope de 100, ayudas de página) |
| T5 · Pruebas | 83 tests (antes 5): cliente, fechas, parámetros y constantes del contrato. `npm test` ahora corre todos los `*.test.mjs` |
| T6 · Documentación | Este informe, `docs/contrato-api.md` (copia exacta del backend), `CLAUDE.md`, `README` y plan |

Lo heredado **no se tocó** salvo dos líneas: `authApi.login` ahora pasa `auth: false` (el login no manda token) y `types/index.ts` lleva una marca *legacy*. Las pantallas y los `*Api.ts` viejos siguen usando sus tipos y sus `catch` al mock hasta su fase (5 a 9).

## 2. Hallazgos al probar contra el backend vivo

### 2.1 El login de la UI vieja nunca funcionó contra el backend real

Chrome real, contra el backend real: el login fallaba con «la respuesta del servidor no es válida». La causa está en el backend: con `Accept: application/json` (el que manda el cliente) **etiqueta el token como `application/json` pero el cuerpo es el token pelado**, que no es JSON.

El cliente heredado hacía `response.json()` sobre ese cuerpo, fallaba, y el `catch` de `authApi.login` caía al **modo demo**: fabricaba un JWT falso y dejaba entrar con cualquier usuario. O sea que «el login anda» en la UI vieja era el login falso, siempre. Los 81 tests unitarios no lo veían (el `fetch` era simulado); `curl` tampoco (sin `Accept`, el backend responde `text/plain`).

Arreglo (`client.ts:236`): un cuerpo `application/json` que no se puede parsear y que **no** empieza con `{` ni `[` se trata como texto; un objeto o arreglo JSON roto sigue siendo error. Con dos tests de regresión.

### 2.2 Una orden repetida llega al navegador como estado 302

Con un navegador real, `POST /integration/sap/orders` con un número que ya existe llega a JavaScript como **estado 302** con el JSON del backend (`Se encontró la Orden numero=…`). El 302 no trae `Location`, así que `fetch` no sigue ninguna redirección. El cliente lo entrega como `ApiError(302, mensaje)`.

### 2.3 Otras cosas medidas

- El cliente viejo mandaba `Content-Type: application/json` hasta en los `GET`, lo que dispara un preflight de CORS que no hace falta. Ahora solo se manda con cuerpo.
- El header `Location` del alta (201) es legible desde el navegador porque la Fase 3 del backend lo expone en CORS.
- El tipo `OrderStatusLog` y el resto coinciden **campo por campo** con el JSON vivo (ver 5).

## 3. Decisiones de diseño

| # | Decisión | Por qué |
|---|---|---|
| C-1 | Los tipos reales van en un módulo nuevo (`@/types/api`); los viejos quedan *legacy* | Reemplazar `Order` rompería toda la UI actual, que se migra en las Fases 5 a 9, y el build debe estar en verde en cada fase (D-15) |
| C-2 | La URL se lee como `process.env.NEXT_PUBLIC_API_URL` **literal**, en el momento de la llamada y sin respaldo | La guía de Next 16: solo ese acceso estático se incrusta al compilar; `process.env[nombre]` no se reemplaza y en el navegador daría `undefined`. El valor queda fijo al compilar (por eso el `Dockerfile` lo recibe como `ARG`) |
| C-3 | `ApiError` lleva el `message` real y el cuerpo **sin `devInfo`** | El stack trace nunca debe llegar a una pantalla |
| C-4 | `status 0` = sin respuesta (red, CORS o tiempo agotado) | Una sola forma de preguntar «¿hubo respuesta?» |
| C-5 | 401 emite el evento solo si **se envió** un token | Un 401 del login son credenciales incorrectas, no una sesión vencida: no debe cerrar nada |
| C-6 | 403 no cierra la sesión | El usuario sigue autenticado, solo le falta el rol |
| C-7 | Tiempo máximo de 20 s que abarca también la lectura del cuerpo | Evita pedidos colgados y acumulación de *polling* |
| C-8 | La cancelación del que llama se relanza como `AbortError`, no como `ApiError` | Los componentes pueden ignorarla al desmontarse |
| C-9 | `client.ts` y los helpers no tienen imports relativos en tiempo de ejecución | Así `npm test` los prueba con el ejecutor de Node, sin empaquetador |
| C-10 | Ejemplos reales tipados (`contract-examples.ts`) | Si un tipo se desvía del JSON del backend, `next build` falla: es la guardia contra repetir el error de la API imaginada (D-16) |
| C-11 | Las fechas del backend se leen **solo** con `parseBackendDate` (hora de Argentina, UTC-3 fijo) | `new Date("2026-11-12T10:30:00")` la interpretaría en la zona del navegador y el tiempo transcurrido saldría corrido |

## 4. Recorrido de una llamada (`apiClient("/orders", { params })`)

1. `buildUrl` (`client.ts:123`) arma la URL: `getBaseUrl` (`:104`) lee `process.env.NEXT_PUBLIC_API_URL` (`:107`), la recorta y falla con un mensaje claro si no existe; los parámetros se agregan omitiendo vacíos y repitiendo los arreglos.
2. `apiRequest` (`:160`) arma los encabezados: `Accept`, y `Content-Type` **solo si hay cuerpo** (`json`, `form` o `body`).
3. Si `auth` no es `false`, agrega `Authorization: Bearer` con el token guardado (`:182`).
4. Crea el `AbortController` con el tiempo máximo (`:185`) y llama a `fetch` (`:200`); lee el cuerpo dentro del mismo tiempo (`:202`).
5. Si falla la red o vence el tiempo: `ApiError(0, …)`; si cancela quien llama: relanza el `AbortError`.
6. Si la respuesta no es 2xx (`:212`): toma el `message` del backend (`:220`), con el mensaje por defecto del código si no viene; con **401 y token enviado** emite `iw3:unauthorized` (`:223`); lanza `ApiError(status, message, cuerpo sin devInfo)` (`:225`).
7. Si es 2xx: cuerpo vacío → `undefined` (201 del alta); JSON → objeto; texto (o JSON etiquetado que no es objeto, `:236`) → texto recortado.

## 5. Pruebas ejecutadas (12/11/2026)

| Prueba | Resultado |
|---|---|
| `npm test` (Node 24) | **83 tests, 0 fallas** (17 suites; 5 heredados + 78 nuevos) |
| `npm test` con **Node 22** real (el del CI) | **83 tests, 0 fallas** |
| `npm run lint` | 0 errores; **13 advertencias, las mismas de antes** (todas `any` del código heredado; el código nuevo no suma ninguna) |
| `npx tsc --noEmit` y `npm run build` | Pasan; los ejemplos reales tipados coinciden con los tipos; sin avisos de seguridad |
| Mutación manual de 7 reglas (devInfo expuesto, 401 sin token que cierra la sesión, respaldo silencioso de la URL, token en el login, ignorar el `message` del backend, fechas en zona local, tope de página) | Las 7 **detectadas** |
| **Chrome real** con una página en `http://localhost:3000` (el cliente empaquetado con `esbuild` e incrustando la URL como Next) contra el backend real con `CORS_ALLOWED_ORIGINS=http://localhost:3000` | **33 verificaciones, 0 incorrectas**: login, listado con filtro y orden, forma de **cada** respuesta (orden, conciliación, historial, lecturas, alarmas, configuración) contra mis tipos, alta con `Location`, 302, 400, 404, 409, 401 con evento, 403, red caída, tiempo agotado y cancelación |
| Desde `http://localhost:3001` (origen no permitido) | El navegador bloquea y el cliente lo informa como `ApiError` de estado 0 |

La prueba con Chrome es la que encontró el defecto del login (2.1): sin ella, el cliente nuevo habría repetido el mismo error.

## 6. Limitaciones

- **La UI heredada no cambió:** las pantallas y los `*Api.ts` siguen con sus `catch` que caen al mock, sus tipos viejos y su login con modo demo hasta las Fases 5 a 9. Lo desplegado en la VM sigue siendo esa UI.
- `NEXT_PUBLIC_API_URL` se fija al compilar: cambiarla en producción exige recompilar la imagen (el workflow usa `http://143.0.100.187:8080/api/v1` si no hay *secret*). Se revisa en la Fase 10.
- El token se guarda en `localStorage` con la clave `iw3_auth_token` (la misma del código heredado); no hay *refresh*: al vencer, vuelve al login.
- No hay reintentos automáticos: un error de red se informa y quien llama decide.
- `contract-examples.ts` hay que actualizarlo cuando el contrato cambie.
- El defecto del `Content-Type` del login es **del backend**: se tolera en el cliente; una mejora posible (no hecha) es que el backend responda `text/plain` siempre.

## 7. Guía de defensa

1. **¿Por qué el frontend heredado «funcionaba» sin backend?** Cada llamada tenía un `catch` que caía a un mock en memoria, incluso el login (con un JWT falso). Ahora un error se informa con el `message` real.
2. **¿Qué es `ApiError` y qué significa `status 0`?** El error único del cliente: lleva el código HTTP y el mensaje del backend. `0` significa que no hubo respuesta: servidor apagado, CORS bloqueado o tiempo agotado.
3. **¿Por qué no se muestra `devInfo`?** Trae el stack trace del servidor en desarrollo; es información interna. El cliente lo quita del error antes de entregarlo.
4. **¿Cuándo se cierra la sesión?** Solo con un 401 en un pedido que **mandó** token (sesión vencida o inválida): se emite `iw3:unauthorized` y el proveedor de sesión cierra. Un 401 del login (credenciales incorrectas) o un 403 (falta de rol) no la cierran.
5. **¿Por qué `process.env.NEXT_PUBLIC_API_URL` se escribe literal?** Next reemplaza en tiempo de compilación solo ese acceso estático. Con `process.env[nombre]` no se reemplazaría y en el navegador valdría `undefined`. Además queda fija al compilar.
6. **¿Qué defecto se encontró con Chrome real y por qué no lo vieron los tests?** El login real viene como `application/json` pero con el token pelado. Los tests usaban un `fetch` simulado y `curl` no manda `Accept: application/json`. Solo un cliente real con el encabezado real lo reproduce.
7. **¿Por qué las fechas necesitan `parseBackendDate`?** El backend manda fechas sin zona en hora de Argentina; `new Date()` las leería en la zona del navegador y los horarios y el tiempo transcurrido saldrían corridos. Argentina no tiene horario de verano, así que el desfasaje fijo (UTC-3) es seguro.
8. **¿Para qué sirve `contract-examples.ts`?** Son respuestas reales del backend con el tipo declarado: si un tipo no coincide con el JSON, `next build` falla. Evita volver a construir contra una API imaginada.
9. **¿Por qué los tipos nuevos no reemplazaron a los viejos?** Reemplazar `Order` rompería toda la interfaz actual. Se conviven hasta migrar cada pantalla (Fases 5 a 9) para tener el build en verde en cada fase.
10. **¿Por qué no se manda `Content-Type` en un `GET`?** Un `GET` con ese encabezado deja de ser una petición simple de CORS y fuerza un preflight innecesario.
11. **¿Cómo se maneja una orden repetida?** El backend responde 302 con un JSON; el navegador no lo sigue (no hay `Location`) y el cliente lo entrega como `ApiError(302, mensaje)`.
12. **¿Cómo se probó que funciona en un navegador?** Con el cliente empaquetado en una página servida desde el origen permitido y Chrome real contra el backend real: 33 verificaciones y, desde otro origen, el bloqueo esperado.

## 8. Lista de comprobación para rendir

- [ ] Explico el recorrido de la sección 4 con archivo y línea.
- [ ] Sé cuándo se cierra la sesión y cuándo no.
- [ ] Puedo contar el defecto del login y por qué solo apareció con un navegador real.
- [ ] Explico por qué la URL se lee literal y qué significa que se fije al compilar.
- [ ] Sé qué cambió y qué no en esta fase (la UI heredada sigue igual).
