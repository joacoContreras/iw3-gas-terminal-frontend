# CLAUDE.md — Contexto del proyecto (frontend + cierre del examen final)

> Leé este archivo completo antes de tocar nada. Es la memoria compartida: dice **dónde estamos, qué reglas
> se siguen y qué contrato tiene el backend**. Actualizá la sección 2 al cerrar cada fase. El plan detallado
> está en `docs/plan-de-trabajo.md`. Leé también `AGENTS.md` (Next.js 16 difiere de lo conocido: ver regla 9).

## 1. Qué es este proyecto

- **Materia:** Ingeniería Web III, 2026. **Examen final** del trabajo integrador (grupo de hasta 3 personas;
  la evaluación es individual y exige entender **todo** el sistema).
- **Qué se entrega:** el backend del segundo parcial (ya aprobado y desplegado) **integrado** con un
  **frontend**, más lo que el final exige y el backend todavía no tiene: **roles** y **alarma de temperatura por e-mail**.
- **Fuente oficial de la consigna:** `Trabajo Integrador - Ingeniería Web 3 2026.pdf` (en la raíz de este repo).
  Ante cualquier duda manda el PDF. Resumen en la sección 4.
- **Dos repositorios, una carpeta** (`Ingenieria Web III (TRABAJO GRUPAL)/`):
  - `iw3-gas-terminal-frontend` (este): Next.js 16.4, React 19.3, TypeScript, Tailwind 4. GitHub `joacoContreras/iw3-gas-terminal-frontend`.
  - `iw3-gas-terminal-backend`: Java 21, Spring Boot 4.1, MySQL 8, JWT. Su `CLAUDE.md` (secciones 6 y 7) es la fuente del contrato de la API.
  - `Ingenieria Web III ( Matio )/`: material de la cátedra. **Solo referencia: no se modifica.**
- **Idioma:** documentación, comentarios y textos de la UI en español; identificadores (código, JSON, rutas) en inglés.
- **Fecha del final:** a confirmar con la cátedra.

### Dónde va cada cosa (dos repositorios separados, aclarado el 12/11/2026)

Los dos repos se comunican **solo por HTTP** (la API, el token y `NEXT_PUBLIC_API_URL`); ninguno compila ni importa código del otro.

| Qué cambia | Repo | Ramas |
|---|---|---|
| Frontend, este `CLAUDE.md`, el plan de trabajo y los informes de las fases 0 y 4 a 10 | `iw3-gas-terminal-frontend` | `fase-N-<tema>` |
| Lo que faltaba del backend para el final: Fase 1 (roles), Fase 2 (alarmas por mail) y Fase 3 (filtros, CORS, H-5 y cierre) | `iw3-gas-terminal-backend` | `final-fase-N-<tema>` |

El informe de cada fase de backend vive en `docs/` del backend; aquí solo se registra su estado. Ante la duda sobre a qué repo va un cambio, **preguntar antes de commitear o pushear**.

## 2. Dónde estamos hoy

**Última actualización:** 13/11/2026 — **Backend completo** (Fases 1 a 3 integradas en `main` del backend y desplegadas). Frontend: Fases 0 y 4 a 9 **integradas en `main` y desplegadas** (PR #2 a #7; las Fases 7 a 9 y el rediseño AetherLoad entraron juntas por el PR #7). Verificación independiente de `main` el 13/11/2026: 162 tests, lint sin advertencias, build en verde y **110 verificaciones con Chrome real** contra el backend real (detalle en `docs/verificacion-main-13-11-2026.md`). **Fase 10** (calidad, documentación y ensayo de defensa) implementada en la rama `fase-10-calidad`, **salvo lo que toca la VM** (T3 a T5), que el usuario dejó fuera.

**Estado del repositorio del backend (12/11/2026, resuelto):** el PR #16 del backend (05/11) había pisado el cierre del segundo parcial. El PR #18 (desde `merge/final-fase-2-alarmas`, 29 commits, sin conflictos) lo restituyó y sumó
las Fases 1 y 2: `main` del backend quedó en un árbol idéntico al probado y el deploy terminó en verde (la VM publica las 16 rutas, incluidas las 4 de alarmas). **Lección:** las ramas parten de `origin/main` actualizado; las ramas con
otra historia dan conflictos (el PR #17, desde la rama original, tenía 162 commits y 10 archivos en conflicto). **Pendiente de decisión:** `origin/main` del backend conserva 120 commits con `Co-Authored-By: Claude`
(rama vieja del PR #16); quitarlos exige `push --force` y coordinar con el equipo. Cada merge a `main` de cualquiera de los dos repos **redespliega la VM** (salvo que el mensaje lleve `[skip ci]`).

| Fase | Contenido | Repo | Estado |
|---|---|---|---|
| 0 | Línea base y puesta en marcha | ambos | **Completada** (Next 16.4.6; backend: 40 tests y 154 pedidos / 364 aserciones sin fallas). Integrada por los PR #2 y #3 (el #3 arregló el `package-lock.json` que había roto el CI) |
| 1 | Roles (backend) | backend | **Completada e integrada en `main` del backend (12/11/2026, PR #18)** y desplegada. 138 tests y Postman 186 pedidos / 428 aserciones sin fallas al cerrarla; informe y PDF en `docs/` del backend |
| 2 | Alarma de temperatura por e-mail (backend) | backend | **Completada e integrada en `main` del backend (12/11/2026, PR #18)** y desplegada: 215 tests, Postman 219 pedidos / 483 aserciones y escenario real con SMTP de mentira (42 verificaciones) sin fallas. **Falta probar con una cuenta SMTP real** (D-12); informe y PDF en `docs/` del backend |
| 3 | Ajustes de contrato para el frontend y cierre del backend | backend | **Completada e integrada en `main` del backend y desplegada** (filtros y orden del listado, CORS, H-5 y contrato congelado); informe y PDF en `docs/` del backend |
| 4 | Conexión real: cliente HTTP, tipos y errores | frontend | **Completada e integrada en `main` (12/11/2026, PR #4, desplegada)**: 83 tests (también con Node 22), lint y build en verde, tipos contrastados con el JSON del backend vivo y **33 verificaciones con Chrome real**. Informe: `docs/fase-4-conexion.md` |
| 5 | Autenticación, sesión, rutas protegidas y roles en la UI | frontend | **Completada e integrada en `main` (12/11/2026, PR #5, desplegada)**: 116 tests (33 nuevos; también con Node 22), 5 mutaciones detectadas, lint y build en verde y **95 verificaciones con Chrome real** contra el backend (login, vencimiento, 401, los 6 roles). Informe: `docs/fase-5-autenticacion.md` |
| 6 | Órdenes: listado, filtros, monitoreo, detalle, ETA y tiempo transcurrido | frontend | **Completada e integrada en `main` (12/11/2026, PR #6, desplegada)**: 127 tests, lint y build en verde, 93 verificaciones con Chrome real. Informe: `docs/fase-6-ordenes.md` |
| 7 | Conciliación | frontend | **Completada e integrada en `main` (13/11/2026, PR #7, desplegada)**: 139 tests (12 nuevos), lint y build en verde, tipos reales del backend, remito oficial y manejo de 409. Informe: `docs/fase-7-conciliacion.md` |
| 8 | Alarmas en la UI | frontend | **Completada e integrada en `main` (13/11/2026, PR #7, desplegada)**: 152 tests (13 nuevos de validación), lint con 1 sola advertencia (legacy), build en verde, banner global, campana, aceptación segura sin username en body (D-5), e-mail status y configuración |
| 9 | Simulador de integración real | frontend | **Completada e integrada en `main` (13/11/2026, PR #7, desplegada)**: 162 tests, lint sin advertencias, build correcto y 70 verificaciones en Chrome contra Spring Boot/MySQL locales. Circuito completo con alarma, correo capturado por SMTP local y conciliación; sin mock ni tipos heredados. Informe: `docs/fase-9-simulador.md`. No se accedió a la VM ni se probó entrega a una casilla externa. |
| 10 | Calidad, despliegue y ensayo de defensa | ambos | **Implementada y probada (13/11/2026, rama `fase-10-calidad`) en lo que no toca la VM**: accesibilidad con axe-core en 10 pantallas × 2 tamaños (2 problemas corregidos, ahora 0), estados de error y vacío verificados, 181 tests (también con Node 22), `architecture.test.mjs` que protege las reglas del proyecto, README y **`docs/guia-de-estudio.md`** con 28 preguntas cruzadas. **Pendiente (VM, con autorización):** despliegue y prueba de punta a punta, `JWT_SECRET`, CORS, usuarios por rol y SMTP real. Informe: `docs/fase-10-calidad.md` |

**No avanzar de fase sin autorización explícita del usuario.**

**Hallazgo que origina este plan (12/11/2026):** el frontend heredado se escribió contra una API imaginada
(rutas y campos que el backend real no tiene) y **cae silenciosamente a un mock en memoria** ante cualquier error,
así que parece funcionar sin backend. Además crea un usuario admin con token falso si no hay sesión, acepta
cualquier credencial si `/login` falla y no protege rutas. Detalle y tabla de diferencias en `docs/plan-de-trabajo.md` (sección 2).

## 3. Reglas de trabajo

1. **Una fase por vez.** Antes de empezar una fase se presenta: objetivo, archivos probables, dependencias y
   criterios de aceptación, y se espera la aprobación. Al terminarla se presenta un resumen ejecutivo y se espera
   la autorización para continuar.
2. **El backend es la fuente de verdad.** El frontend se adapta al contrato real (sección 5), nunca al revés. Si
   algo falta en el backend, se anota, se propone y se pide autorización: no se inventa en el frontend.
3. **Respetar la metodología de la cátedra** en el backend (`I*Business` + `*Business`, excepciones *checked*,
   `try/catch` por método en el controller, `StandartResponse`, constantes en `Constants`, eventos de Spring,
   `EmailBusiness`, `@Scheduled`, `@PreAuthorize`). La prioridad es el enfoque de la cátedra, no una arquitectura más moderna.
4. **Sin mocks ni atajos de demo en el código de producción.** Nada de datos falsos, tokens falsos ni `catch` que
   esconda un error del backend. Cada error se muestra al usuario con el mensaje real.
5. **Sin sorpresas:** no agregar dependencias innecesarias, no refactorizar fuera de la fase, no eliminar
   funcionalidad sin explicarlo, no ampliar el alcance sin consultar.
6. **Honestidad:** no afirmar que una prueba pasó si no se ejecutó; no ocultar errores; si falta un dato, decirlo
   antes de asumirlo; distinguir **requisito de la consigna** de **decisión de diseño**.
7. **Seguridad:** no inventar credenciales ni subir secretos. Las del entorno local (`root/root`, `admin/admin123`)
   son **solo de desarrollo**. Las credenciales SMTP, la clave JWT y los accesos a la VM **nunca** van al repo
   (variables de entorno o `.env.local`, ya ignorado por `.gitignore`).
8. **Git (en ambos repos):**
   - **El `main` del backend no se toca** salvo por Pull Request aprobado: la entrega del parcial queda intacta. El
     trabajo del final va en ramas `final-fase-N-<tema>` (se pueden encadenar si la anterior no está integrada).
   - **Frontend:** una rama por fase, `fase-N-<tema>`, desde `main` actualizado.
   - **Commits atómicos de no más de 100 líneas** (agregadas + borradas), en español, con formato
     `tipo(ámbito): descripción` (`feat`, `fix`, `docs`, `chore`, `test`, `build`, `refactor`).
   - **Sin coautoría de Claude:** los commits y los Pull Request **no** llevan `Co-Authored-By: Claude …` ni
     "Generated with Claude Code". Esta regla tiene prioridad sobre la atribución por defecto de Claude Code.
   - **No se hace commit, push ni merge hasta que el usuario lo pide.** Todo cambio a `main` entra por Pull Request
     (acuerdo del equipo: aprobación de 3 de 4 integrantes; GitHub no lo exige, se cumple a mano: abrir como *draft*).
   - `main` del frontend **se despliega solo** (GitHub Actions) y `main` del backend también: ningún merge sin
     autorización, y nunca tocar la VM ni `~/infra` sin que el usuario lo pida.
9. **Next.js 16 no es el que se conoce.** Antes de escribir código de Next, leer la guía correspondiente en
   `node_modules/next/dist/docs/` (requiere `npm ci`) y respetar los avisos de deprecación. No asumir APIs de memoria.
10. **Documentación por fase** en `docs/fase-N-<tema>.md`: *informe breve* (qué se hizo y por qué, archivos tocados
    con motivo, recorrido de los datos, pruebas **ejecutadas** con su resultado, limitaciones) y *guía de defensa*
    (**≥ 8 preguntas con respuesta** y qué debe poder explicar cada integrante). En el backend, además, se
    respeta su regla de documentación (`CLAUDE.md` del backend, regla 8).
11. **Una fase está terminada** cuando: la funcionalidad está implementada y respeta la cátedra y la consigna;
    `npm run lint`, `npm test` y `npm run build` pasan (frontend) o `./mvnw -B test` y la colección Postman pasan
    (backend); se probó **contra el backend real** (no contra un mock) y el resultado quedó escrito; existe el
    documento de la fase; las limitaciones están registradas; y el usuario lo autorizó.
12. **Estudiar es parte del trabajo:** la defensa es individual. Cada fase termina con la explicación del flujo
    en el formato punto por punto que usa el usuario (paso a paso, con archivo y línea).

## 4. La consigna del final, resumida

> Ante cualquier duda manda el PDF. Los Puntos 1 a 5 (proceso) y el modelo de datos ya están implementados en el backend.

| # | Requisito del examen final | Dónde se resuelve |
|---|---|---|
| 1 | 100 % de los endpoints (Puntos 1 a 5) | Backend, **ya hecho** |
| 2 | **Roles** de usuario que regulen el consumo de las APIs | Fase 1 (backend) y Fase 5 (UI) |
| 3 | **Alarma de temperatura** en el Punto 3: umbral configurable, **correo** a destinatarios configurables, **sin reenvío hasta que un usuario autorizado la acepte** | Fase 2 (backend) y Fase 8 (UI) |
| 4a | Frontend: **autenticación** de usuarios | Fase 5 |
| 4b | **Administración y monitoreo en tiempo real** de las órdenes: número, estado, camión, preset, carga actual, últimas temperatura, densidad y caudal, **filtros y orden** por estado u otros criterios | Fase 6 |
| 4c | **ETA** (preset, masa acumulada y caudal) | Fase 6 |
| 4d | **Tiempo transcurrido** desde el inicio de la carga (**solo órdenes en estado 2**) | Fase 6 |
| 4e | **Gestión de alarmas:** verlas, **aceptarlas**, registro de usuario, fecha, hora y observación (opcional) | Fase 8 |
| 4f | **Conciliaciones**, **solo para órdenes en estado 4** | Fase 7 |

Estados de la orden: 1 Pendiente de pesaje inicial · 2 Con pesaje inicial registrado (aquí llegan las lecturas) ·
3 Cerrada para carga · 4 Finalizada. Secuenciales y unidireccionales.

## 5. Contrato real del backend (lo que el frontend DEBE usar)

Base: `{NEXT_PUBLIC_API_URL}` = `http://localhost:8080/api/v1` en local. Todo exige `Authorization: Bearer <jwt>`
salvo `POST /login`. El estado viaja como **número** (`"status": 2`). Fechas `LocalDateTime` **sin zona**
(`2026-11-12T10:30:00`, hora de Argentina). Los errores devuelven `{ message, code, devInfo }`.
Fuente completa y ejemplos reales: **`docs/contrato-api.md`** (copia del contrato congelado del backend, generado desde su `/v3/api-docs`). Los tipos están en `src/types/api`.

| Uso | Método y ruta | Cuerpo / respuesta |
|---|---|---|
| Login | `POST /login` (formulario `username`, `password`) | 200 JWT **como texto** (con `Accept: application/json` el `Content-Type` dice json pero el cuerpo es el token pelado: el cliente lo tolera); 401 con JSON |
| Listado | `GET /orders?status=&sort=&page=&size=` | `{ content: Order[], page: { size, number, totalElements, totalPages } }`; `status` 1 a 4; `sort=campo,dirección` por `orderNumber`, `plannedLoadDateTime`, `receptionDateTime`, `status` o `preset` (otro campo → 400); sin `sort`, la más reciente primero; `size` máx. 100 |
| Orden | `GET /orders/{orderNumber}` | `Order` (**sin** `activationPassword`) |
| Historial de estados | `GET /orders/{orderNumber}/status-log` | filas con estado anterior y nuevo, fecha, actor, observaciones |
| Lecturas | `GET /orders/{orderNumber}/details?page=&size=` | `{ content, page }`, por `id` ascendente |
| Conciliación | `GET /orders/{orderNumber}/reconciliation` | solo estado 4 (409 si no): `orderNumber, tare, finalWeight, loadedProduct, scaleNet, difference, averageTemperature, averageDensity, averageFlowRate` |
| Punto 1 (SAP) | `POST /integration/sap/orders` | cuerpo en la sección 5 del contrato; 201 sin cuerpo + header `Location`; **302 si el número ya existe** (llega al navegador como estado 302 con el `message` del backend, sin seguir ninguna redirección) |
| Punto 2 (TMS) | `POST /integration/tms/orders/{n}/tare` | `{ weight }` → `{ activationPassword }` |
| Punto 3 (carga) | `POST /integration/loader/activation` | `{ orderNumber, password }` → `{ preset }` (403 si la clave es incorrecta) |
| Punto 3 (lecturas) | `POST /integration/loader/orders/{n}/details` | `{ accumulatedMass, density, temperature, flowRate }` → siempre 200 `{ saved, reason }` |
| Punto 4 (cierre) | `POST /integration/loader/orders/{n}/close` | sin cuerpo → la orden con `status: 3` |
| Punto 5 (TMS) | `POST /integration/tms/orders/{n}/final-weight` | `{ weight }` → conciliación |

Campos de `Order` que usa la UI: `orderNumber`, `status`, `truck { plate, tanks[{ number, capacityLiters }] }`,
`driver { name, lastName, document }`, `customer { companyName, contact }`, `product { name, description }`,
`plannedLoadDateTime`, `preset`, `receptionDateTime`, `tare`, `initialWeighingDateTime`, `activationDateTime`,
`loadingStartDateTime`, `loadingEndDateTime`, `lastAccumulatedMass`, `lastDensity`, `lastTemperature`,
`lastFlowRate`, `finalWeight`, `finalWeighingDateTime`. Se identifica por **`orderNumber`**, no por `id`.

Roles por endpoint (403), alarmas (`/alarms`, `/alarms/{id}/acknowledge`, `/alarms/config`) y filtros y orden del listado **ya están en el contrato** (Fases 1 a 3 del backend).

## 6. Convenciones del frontend

- **Identidad visual:** AetherLoad, aplicada en `estilos-aetherload` (13/11/2026). Guía formal: `docs/styling.txt`; implementación y verificaciones: `docs/estilos-aetherload.md`. Paleta oscura estable con tokens semánticos en `src/app/globals.css`, fuente Geist y marca original en `public/brand/aetherload-logo.png`. Usar `Brand`, componentes UI y `control-input`/`aether-table`; no reintroducir paletas de color por pantalla ni variantes según el tema del sistema. El remito conserva una paleta clara para imprimir. Este trabajo visual fue autorizado directamente por el usuario; no implica completar la Fase 10 ni desplegar.
- **Estructura por feature** (`src/features/<feature>/{components,hooks,services}`), páginas finas en `src/app`,
  componentes de UI genéricos en `src/components/ui`, tipos en `src/types`, utilidades en `src/lib`.
- **Tipos que reflejan el JSON real** (nombres en inglés iguales al backend). Un único cliente HTTP
  (`src/services/api/client.ts`) agrega el token, interpreta `{ message }` y lanza `ApiError(status, message)`.
- **Tiempo real = polling** con `usePolling` (`src/lib/use-polling.ts`: `setTimeout` encadenado, sin pedidos superpuestos; el backend no tiene WebSockets ni SSE y la cátedra tampoco los enseña). Se pausa con la pestaña oculta, se cancela al desmontar y un fallo conserva el último dato con el aviso. Filtro, orden y paginación de los listados se piden **al servidor**.
- **Sesión:** JWT en `localStorage` (solo el token; usuario, roles y `exp` se derivan de él en `features/auth/lib/session.ts`); las rutas se protegen en el cliente con `AuthGate` (reactivo, en el layout del dashboard); `401` y el vencimiento cierran la sesión y vuelven al login; `403` muestra "sin permisos" sin cerrar la sesión. Los permisos de la interfaz viven en `features/auth/lib/permissions.ts` (`can(...)`, `PermissionGate`, `RequirePermission`) y un test los compara con la matriz de `docs/contrato-api.md`: **ocultar no es seguridad, el backend decide**.
- **Dependencias:** el CI corre `npm ci` con Node 22 (npm 10). Después de cualquier cambio en `package.json` o en el lock, validar con `npx -y npm@10 ci --dry-run` (y mejor una copia limpia con `npm ci`, lint, `npm test` y `npm run build`); el lock generado con otro npm puede no pasar.
- **TypeScript estricto, sin `any`**; el lint no debe tener advertencias nuevas. Textos de UI en español.
- **Cliente HTTP único:** `src/services/api/client.ts` (`apiClient` devuelve los datos; `apiRequest` suma estado y cabeceras). Todo error es `ApiError(status, message)` con el `message` real; `status 0` = sin respuesta. Los tipos del contrato son `@/types/api` y `@/types` los reexporta; los tipos heredados y el mock se eliminaron en la Fase 9. Las fechas del backend se leen solo con `@/lib/dates` (`parseBackendDate` las interpreta como hora de Argentina) y los parámetros de `GET /orders` y `/alarms` se arman con `@/lib/api-query`. La URL de la API se lee como `process.env.NEXT_PUBLIC_API_URL` **literal** (Next solo incrusta ese acceso estático) y se fija al compilar.
- **Pruebas:** `npm test` corre todos los `*.test.mjs` con el ejecutor de Node (`node --experimental-strip-types --test "src/**/*.test.mjs"`; se probó con Node 22, el del CI). Un módulo con lógica debe poder importarse desde la prueba: sin imports relativos en tiempo de ejecución (solo `import type`) y sin sintaxis que Node no borre (enums, propiedades de parámetro del constructor).
- **Zona horaria:** el backend envía hora de Argentina sin offset. Los cálculos de tiempo transcurrido deben
  interpretar esas fechas como hora local de Argentina, no depender de la zona del navegador.

## 7. Decisiones de diseño (a confirmar o ajustar en cada fase)

| # | Decisión | Fase |
|---|---|---|
| D-1 | **Backend primero, frontend después:** el frontend se conecta una sola vez al contrato final (evita repetir el error de construir contra una API que cambia). | 1–3 antes de 4–9 |
| D-2 | Matriz de roles del plan (sección 4.1): **aprobada el 12/11/2026**. | 1 |
| D-3 | (**Aprobada 12/11/2026**) Alarma **por orden**: mientras exista una alarma pendiente de esa orden no se crea ni se envía otra; al aceptarla, una nueva superación vuelve a alarmar. Umbral y destinatarios **globales**. | 2 |
| D-4 | Un fallo del correo **nunca** hace fallar la lectura del caudalímetro (se registra y la lectura se guarda). El envío es asíncrono y posterior al commit. | 2 |
| D-5 | El usuario que acepta la alarma sale del **token**, no del cuerpo de la petición. | 2 |
| D-6 | El PIN de activación **no** se muestra en el detalle de la orden (el backend no lo publica): solo aparece en el simulador, en la respuesta de la tara. | 6, 9 |
| D-7 | Se elimina el mock (`src/services/mock/mockStore.ts`) y todo `catch` que caiga a datos falsos; se borra el archivo cuando nadie lo importe. | 4–9 |
| D-8 | Tiempo real por polling (2–5 s según pantalla). Sin WebSockets. | 6 |
| D-9 | Documentación por fase más liviana que la del backend: informe breve + guía de defensa (≥ 8 preguntas). | todas |
| D-10 | **H-5 entra en el final:** clave JWT y CORS por variables de entorno, con el valor actual como respaldo. Aprobado 12/11/2026. | 3 |
| D-11 | **Next.js actualizado a 16.4.6** (12/11/2026) por avisos de seguridad de 16.4.0. No usar Server Actions ni `use cache` sin revisar los avisos vigentes. | 0 |
| D-12 | **Cuenta SMTP:** se configura cuando el correo esté hecho y se pruebe (Fase 2, T9); hasta entonces, solo pruebas con el envío simulado. | 2 |
| D-14 | **CORS (H-30): RESUELTO el 12/11/2026 en la Fase 3 del backend** (verificado en la VM y con Chrome real). Texto original: el preflight `OPTIONS` del backend respondía 401; se corrige en la Fase 3 (`http.cors()`). Hasta entonces el navegador no puede llamar a la API desde otro origen: para probar el frontend antes de la Fase 3 se usa un *rewrite* de Next hacia `localhost:8080` o se adelanta esa corrección. El frontend nunca muestra `devInfo`, solo `message`. | 3, 4 |
| D-13 | **Ritmo:** por ahora avanza solo Martín González, sin fecha de final fijada; el reparto entre el equipo se decide más adelante. | todas |
| D-15 | Los tipos del contrato real viven en `@/types/api`; los de `@/types/*` (escritos contra una API imaginada) se mantuvieron como *legacy* hasta migrar cada pantalla y **se eliminaron en la Fase 9**. Así el build siguió en verde en cada fase. | 4 a 9 |
| D-16 | `src/types/api/contract-examples.ts` guarda ejemplos **reales** del backend anotados con los tipos: si un tipo se desvía del JSON, `next build` falla. Al cambiar el contrato se actualiza ese archivo. | 4 |

## 8. Entorno local

```bash
# Backend (repo hermano): base MySQL y aplicación, perfil de desarrollo
cd ../iw3-gas-terminal-backend && docker compose up -d
./mvnw spring-boot:run -Dspring-boot.run.profiles=mysqldev      # http://localhost:8080
# Usuarios de prueba: docs/sql/seed-dev-users.sql (admin / admin123, solo desarrollo)

# Frontend (este repo)
npm ci
echo NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1 > .env.local
npm run dev            # http://localhost:3000
npm run lint && npm test && npm run build
```

Producción: la VM (`jc755.duckdns.org`) corre 4 contenedores (`iw3-app`, `iw3-frontend`, `iw3-mysql-prod`, `nginx`) y
se actualiza con GitHub Actions al hacer push a `main`. Docker local se apaga cuando no se usa.

## 9. Qué NO hacer

- No hacer commit, push, merge, ni tocar la VM, sin que el usuario lo pida.
- No modificar la carpeta de la cátedra ni el `main` del backend fuera de un PR aprobado.
- No reintroducir mocks, tokens falsos, usuarios por defecto ni `catch` silenciosos.
- No inventar endpoints o campos: si el contrato no lo tiene, se registra y se pide autorización.
- No avanzar de fase sin autorización explícita.
