# Fase 5 — Autenticación, sesión, rutas protegidas y roles en la UI

**Rama:** `fase-5-autenticacion` (desde `main`, `239aeed`) · **Fecha:** 12/11/2026 · **Estado:** integrada en `main` (PR #5) y desplegada
**Objetivo:** que solo entre quien se autentica contra el backend real, que la sesión se comporte bien (vence, se cierra, se restaura) y que cada rol vea solo lo que el backend le permite.
**Regla 9 (Next 16):** antes de escribir código se leyeron las guías de autenticación y de `useRouter`, `usePathname` y `useSearchParams` de `node_modules/next/dist/docs/`; condicionan C-2 y C-5.

## 1. Qué se hizo

| Tarea del plan | Resultado |
|---|---|
| T1 · `authApi` solo con login real | `src/features/auth/services/authApi.ts`: únicamente `POST /login`. Se borraron `buildMockJwt` y el `catch` que, ante **cualquier** error, fabricaba un token falso y daba rol según el nombre de usuario. Ahora el error real llega a la pantalla |
| T2 · `AuthContext` sin usuario por defecto | Sin sesión guardada queda **sin sesión** (antes creaba un admin con `demo-jwt-token-terminal-admin`). Restaura validando `exp`; cierra por botón, 401, vencimiento (temporizador), vuelta de la suspensión del equipo y cierre desde otra pestaña |
| T3 · Rutas protegidas | `AuthGate` en el layout del dashboard: sin sesión → `/login`; en `/login`, con sesión → `/`. Reactivo (ver C-2) |
| T4 · Login | Sin credenciales por defecto ni botones «Acceso rápido de demostración»; aviso de sesión vencida/rechazada |
| T5 · Roles en la UI | `lib/permissions.ts` (espejo de la matriz del backend), `PermissionGate`, `RequirePermission`, `ForbiddenView`; menú, campana, botones de cerrar orden y aceptar alarma, configuración de alarmas y simulador según el rol; barra con usuario, rol y cierre de sesión |
| T6 · Pruebas | 33 tests nuevos (JWT, vencimiento, roles, y la tabla de permisos contra `docs/contrato-api.md`); 5 mutaciones detectadas; 95 verificaciones con Chrome real |
| T7 · Documentación | Este informe, `CLAUDE.md` y plan (el `README` no mencionaba el login de demostración) |

### Archivos tocados

| Archivo | Motivo |
|---|---|
| `src/features/auth/lib/session.ts` (+test) | Decodifica el JWT, valida `sub`/`exp`/`roles`, arma la `Session`; módulo puro, sin imports en tiempo de ejecución |
| `src/features/auth/lib/permissions.ts` (+test) | Roles, permisos de la interfaz y `can`/`hasAnyRole`; el test lee la tabla del contrato y exige coincidencia |
| `src/features/auth/context/AuthContext.tsx`, `services/authApi.ts` | Sesión real (arriba) |
| `src/features/auth/components/auth-gate.tsx` | Guarda de rutas |
| `src/components/shared/{permission-gate,forbidden-view,dashboard-shell}.tsx` | Ocultar acciones, pantalla «sin permisos» y marco autenticado (alarmas, navbar, sidebar) |
| `src/app/(dashboard)/{layout.tsx,orders,alarms,simulator}/layout.tsx`, `page.tsx` | Guarda de sesión y permiso por sección |
| `src/app/(auth)/login/page.tsx`, `navbar.tsx`, `sidebar.tsx` | Login limpio, usuario y rol, menú por permiso |
| `orders/[id]/page.tsx`, `alarm-table.tsx`, `alarm-config-form.tsx`, `alarms/page.tsx`, `useAlarms.ts` | Botones y pedidos según el rol (cerrar orden, aceptar alarma, configuración solo lectura, no pedir lo prohibido) |
| `alarmsApi.ts`, `ordersApi.ts` | Guarda *legacy* (C-6) |
| `src/services/api/client.ts` | Solo se exporta `TOKEN_STORAGE_KEY` |
| `role-guard.tsx`, `types/auth.ts` | **Borrados**: sin uso o reemplazados (`UserRole` de 4 roles inventados) |

## 2. Decisiones de diseño

- **C-1 · La sesión es el token.** Solo se guarda el JWT (`iw3_auth_token`); usuario, roles y vencimiento se **derivan** de él en cada carga. Antes se guardaba también un `iw3_auth_user` que podía no coincidir con el token.
- **C-2 · La guarda es reactiva.** En Next un `layout` no se vuelve a renderizar al navegar, así que comprobar la sesión una vez al entrar no alcanza. `AuthGate` depende del estado de `AuthProvider`: cualquier cierre de sesión saca al usuario de inmediato.
- **C-3 · El cliente no verifica la firma.** No puede (la clave es del backend). Lee `exp` y `roles` solo para la interfaz; si el token fuera falso, el primer pedido recibe 401 y la sesión se cierra (probado: escenario 7). **La seguridad real es el backend.**
- **C-4 · La interfaz oculta, el backend decide.** Cada permiso apunta a los endpoints del contrato y toma los roles comunes a todos; si el contrato cambia, el test falla.
- **C-5 · Sin `usePathname`/`useSearchParams` nuevos** (con `cacheComponents` exigen `Suspense`); la guarda usa estado, no la URL. No se agregó `?next=`: evitaría pasar una URL no confiable a `router.replace`.
- **C-6 · Pantallas heredadas con guarda mínima.** El backend real responde una página `{ content, page }` y las pantallas viejas esperan un arreglo. Los `*Api.ts` devuelven `[]` si no llega un arreglo, para no romper la pantalla hasta que la Fase 6 (órdenes) y la 8 (alarmas) las reescriban.
- **C-7 · No se piden datos que el rol no puede ver.** `useAlarms` consulta `/alarms` solo si el rol puede ver alarmas y `/alarms/config` solo si puede verla (antes un OPERADOR habría recibido 403 cada 5 s).

## 3. Recorrido de una sesión

1. `/login` → `authApi.login` → `POST /login` (formulario, sin token) → texto JWT.
2. `sessionFromToken` lo decodifica, exige `sub`, `exp` y que no esté vencido; si no sirve, error «token no válido» y no se guarda nada.
3. `AuthProvider` guarda el token, arma `user` y programa un temporizador al `exp`.
4. `AuthGate` deja pasar; `DashboardShell` monta navbar, menú y alarmas filtrados por `can(permiso)`.
5. Cada pedido de `apiClient` agrega `Authorization: Bearer`. Un **401** dispara `iw3:unauthorized` → `endSession("unauthorized")`; un **403** no cierra la sesión.
6. Cerrar sesión borra el token, `AuthGate` redirige y las demás pestañas se enteran por el evento `storage`.

## 4. Pruebas ejecutadas (12/11/2026)

| Prueba | Resultado |
|---|---|
| `npm test` (Node 24 local) | 116 tests, 0 fallas (33 nuevos de esta fase) |
| `tsc --noEmit`, `npm run lint` | sin errores; 10 advertencias `any` en código heredado (ninguna nueva) |
| `npm run build` (`NEXT_PUBLIC_API_URL` local) | compila; 8 rutas |
| Mutaciones | 5 de 5 detectadas: vencimiento `<` en vez de `<=`, no validar `exp`, restaurar token vencido, dar permiso de más a OPERADOR (contrato), no normalizar `ROLE_` |
| **Chrome real contra el backend real** (`localhost:8080`, usuarios sembrados) | **95 verificaciones, 0 fallas** (detalle abajo) |
| Réplica del CI (copia limpia sin `node_modules`): `npm ci` con npm 10, lint y build; los 116 tests también con **Node 22** | `npm ci` ok, lint 0 errores, build ok; 116 de 116 con Node 22.23 (lint y build se corrieron con Node 24, los tests con 22) |

Escenarios con Chrome: (1) sin sesión, 6 rutas redirigen a `/login`, formulario vacío y sin accesos rápidos; (2) contraseña incorrecta → mensaje real del backend, 401, sin token; (3) backend inalcanzable → error de conexión y **sin** modo demo; (4) login de admin: JWT real HS512, usuario y rol en la barra, recarga restaura, `/login` redirige, cerrar sesión borra y «Atrás» no muestra el panel; (5) token vencido y el token falso del código viejo se rechazan y se borran; (6) el temporizador cierra la sesión al vencer el token; (7) token con firma falsa → el backend responde 401 y la sesión se cierra; (8) los 5 usuarios restantes (supervisor, operador, sap, tms, loader): rol mostrado, menú, campana, simulador bloqueado, configuración de alarmas (supervisor en solo lectura, operador sin pestaña), **0 pedidos 401/403**; (9) botones por rol; (10) cerrar sesión en una pestaña cierra la otra.

## 5. Limitaciones y observaciones

- **El escenario 9 usa respuestas simuladas** con la forma que lee la pantalla heredada (el backend real devuelve otra forma, C-6): prueba que los botones «Aceptar», «Aceptar Alarma» y «Cerrar Orden» aparecen o no según el rol, **no** que el flujo funcione contra el backend. Eso es de las Fases 6 y 8.
- **Las pantallas de órdenes y alarmas siguen siendo las heredadas:** con el backend real muestran listas vacías hasta las Fases 6 y 8. Los `catch` al mock siguen ahí (D-7). El sitio desplegado cambia de «datos de mentira» a «vacío» al mergear esta fase.
- **Token en `localStorage`:** un XSS podría leerlo. Next recomienda cookies de sesión del lado del servidor, pero el backend entrega un JWT por `POST /login` y no tiene sesión por cookie; cambiarlo es una decisión de arquitectura fuera de esta fase.
- **La firma del token no se verifica en el cliente** (C-3).
- **El mensaje de credenciales incorrectas del backend está en inglés** («Invalid password»): la UI muestra el `message` real (regla 4). Si se quiere en español, el cambio es del backend.
- **Sin renovación de token:** el backend no tiene *refresh*; al vencer (1 h) hay que volver a entrar.
- El rol `ROLE_USER` y los sistemas externos (SAP, TMS, LOADER) pueden iniciar sesión pero no tienen pantallas: ven «sin permisos» (coherente con la matriz).
- El 403 sin cierre de sesión está cubierto por los tests del cliente (Fase 4); la interfaz nunca lo provoca (0 en los escenarios).

## 6. Guía de defensa

1. **¿Cómo sabe el frontend que alguien está autenticado?** Hay un JWT en `localStorage`; `sessionFromToken` lo decodifica y comprueba que tenga `sub`, `exp` y no esté vencido. Eso arma la `Session` que expone `AuthProvider`.
2. **¿El frontend valida la firma del JWT?** No puede: la clave (`JWT_SECRET`) es del backend. Solo lee el payload para la interfaz. Si el token es falso, el backend responde 401 en el primer pedido y la sesión se cierra (escenario 7).
3. **¿Ocultar un botón es seguridad?** No. La interfaz oculta por comodidad; cada endpoint tiene `@PreAuthorize` y responde 403 aunque se llame a mano.
4. **¿Cómo se protegen las rutas y por qué no alcanza con un `middleware` o con mirar la sesión en el layout?** `AuthGate` redirige a `/login` sin sesión. Un layout no se re-renderiza al navegar, así que la guarda depende del estado de `AuthProvider`. El token vive en `localStorage`, que el servidor de Next no ve; por eso no se usa `middleware`.
5. **¿Qué pasa cuando vence el token?** Un temporizador al `exp` cierra la sesión; si el equipo estaba suspendido, `visibilitychange` lo revisa al volver; y si el backend responde 401, el cliente dispara `iw3:unauthorized` y también se cierra.
6. **¿Qué diferencia hay entre 401 y 403 en la interfaz?** 401: la sesión ya no vale → cierra y vuelve al login. 403: el usuario sigue autenticado pero su rol no alcanza → «sin permisos», sin cerrar.
7. **¿Cómo se mantiene sincronizada la tabla de permisos con el backend?** `permissions.test.mjs` lee la tabla de roles de `docs/contrato-api.md` (generada desde `/v3/api-docs`) y exige que cada permiso coincida con los roles comunes de sus endpoints.
8. **¿Qué puede hacer cada rol?** ADMIN todo; SUPERVISOR: ver y cerrar órdenes, ver y aceptar alarmas, ver (no editar) la configuración; OPERADOR: ver y cerrar órdenes y ver alarmas; SAP, TMS, LOADER y USER: ninguna pantalla (son sistemas o rol sin permisos de personas); el simulador es solo ADMIN porque llama a endpoints de los tres sistemas.
9. **¿Qué se eliminó del frontend heredado y por qué?** El admin y el token de demostración que se creaban sin sesión, el `catch` que aceptaba cualquier credencial si `/login` fallaba, los accesos rápidos con contraseña conocida y los roles inventados: con eso cualquiera entraba como administrador sin backend.
10. **¿Qué riesgo tiene guardar el JWT en `localStorage`?** Si hubiera un XSS, un script podría robarlo. La alternativa (cookie `HttpOnly`) exige que el backend la emita; hoy entrega el token en el cuerpo.
11. **¿Por qué `useAlarms` no pide `/alarms/config` a un OPERADOR?** Porque el backend responde 403 (solo ADMIN y SUPERVISOR); con *polling* se repetiría cada 5 s.

**Qué debe poder explicar cada integrante:** el flujo login → token → sesión → guarda → cierre; la diferencia entre 401 y 403; por qué la interfaz no es la seguridad; qué ve cada rol y de dónde sale esa tabla.
