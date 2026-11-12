# Fase 0 — Línea base y puesta en marcha

**Fecha:** 12/11/2026 · **Estado:** completada, a la espera del visto bueno del usuario · **Código modificado:** ninguno; solo `package.json` y `package-lock.json` del frontend (actualización de Next, autorizada) y los documentos nuevos. El backend quedó intacto.

## 1. Qué se midió en el frontend (T1)

Entorno: Node 24.13.0, npm 11.6.2, `main` en `cc6097f`. Comandos ejecutados desde la raíz del repo.

| Comando | Resultado |
|---|---|
| `npm ci` | 366 paquetes en 2 min 32 s; `npm audit`: **8 vulnerabilidades** (7 moderadas, 1 crítica) |
| `npm run lint` | **0 errores, 13 advertencias**, todas `@typescript-eslint/no-explicit-any` (login, alarmas, auth, órdenes, conciliación) |
| `npm test` | **5 tests, 5 pasan** (solo cubren `src/lib/calculations.ts`); Node avisa `MODULE_TYPELESS_PACKAGE_JSON` (falta `"type": "module"` en `package.json`; es un aviso, no un error) |
| `npm run build` | Compila con Turbopack, pasa TypeScript y genera las **10 rutas** (`/`, `/alarms`, `/login`, `/orders`, `/orders/[id]`, `/orders/[id]/reconciliation`, `/simulator`, `/_not-found`). Con *Cache Components* y *Partial Prefetching* activos |

**Sobre `next.config.ts`:** las opciones `cacheComponents`, `partialPrefetching` y la regla de Turbopack para el plugin de Tailwind **funcionan** con
Next 16.4.0; el riesgo anotado en el plan queda descartado. Las rutas de detalle (`/orders/[id]`) salen como *Partial Prerender*.

**Anomalía en el primer build:** terminó con `SecurityFatalError` y un mensaje que pedía actualizar Next (y ejecutar un comando de actualización automática). Se
repitió el comando y el segundo build terminó bien con solo una advertencia. No se ejecutó ninguna actualización.

## 2. Hallazgo de seguridad (`next@16.4.0`)

`npm audit` confirma, con independencia de ese mensaje, que **Next 16.0.0 a 16.4.0** está afectado por 3 avisos (uno crítico):

| Aviso | Qué es | ¿Aplica a este proyecto? |
|---|---|---|
| GHSA-2464-fhr4-w9xw | RCE sin autenticación en la API de optimización de imágenes con SVG | No se usa `next/image` ni SVG de usuarios |
| GHSA-673q-mjm6-r5xr | RCE sin autenticación en funciones `use cache` que devuelven *typed arrays* | No hay funciones `use cache` en el código |
| GHSA-p3m5-59mp-jv5r | Denegación de servicio con Server Actions | No hay Server Actions |

Las otras 7 advertencias son de `minimatch` (DoS moderado) dentro de la cadena de `typescript-eslint`, solo en desarrollo.

**Resuelto (autorizado por el usuario):** `npm install --save-exact next@16.4.6 eslint-config-next@16.4.6`. Cambia solo esas dos líneas de `package.json` y el `package-lock.json`.
Después: lint 0 errores y 13 advertencias (igual), tests 5 de 5, build correcto con las 10 rutas y **sin** la advertencia de seguridad; `npm audit` ya no marca `next` (quedan los 7 avisos moderados de `minimatch`).

## 3. Estado de las pantallas que ya existen

No se probaron contra el backend: se leyó el código (ver el análisis del 12/11/2026 y la tabla de diferencias en `docs/plan-de-trabajo.md`, sección 2). Cualquier
prueba hoy contra un backend real fallaría en silencio y caería al mock, que es justamente lo que el plan elimina.

## 4. Qué se midió en el backend (T3 y T4)

Entorno: Java 21, MySQL 8 en Docker (`iw3-gas-mysql`, base `iw3_db` con 77 órdenes de pruebas anteriores y el usuario `admin` ya sembrado), perfil `mysqldev`, `newman 6.2.3` instalado en una carpeta temporal (no en los repos).

| Medición | Resultado |
|---|---|
| `./mvnw -B test` | **40 tests, 0 fallas** (BUILD SUCCESS) |
| Arranque con `mysqldev` | Responde `/v3/api-docs` con 200 |
| `POST /api/v1/login` con `admin` / `admin123` | 200, JWT de 256 caracteres; payload `{ sub: "admin", roles: ["ROLE_ADMIN"], email, version, exp }` |
| Login con clave incorrecta | 401 con JSON `{ message, code, devInfo }` |
| `GET /orders` sin token / con token | 401 / 200 con `{ content, page }` |
| Colección Postman completa (newman) | **154 pedidos, 364 aserciones, 0 fallas**, 22 s; idéntico a la línea base del parcial |
| JSON de una orden | Coincide con el contrato documentado (`plate`, `tanks[].capacityLiters`, `companyName`, `status`, `lastTemperature`, etc.) |

Docker, el contenedor y la aplicación se apagaron al terminar. Docker Desktop reinició por su cuenta dos contenedores ajenos al TP (`giganteelectronico-db-1` e `iw3-mysql`); no se tocaron.

## 5. Hallazgos nuevos del backend (para el plan)

| # | Hallazgo | Evidencia | Impacto | Qué hacer |
|---|---|---|---|---|
| **H-30** | **El preflight de CORS devuelve 401** | `OPTIONS /api/v1/orders` con `Origin: http://localhost:3000` responde `401` (también en `/login`, que es público). `SecurityConfiguration` configura CORS solo con `addCorsMappings` (línea 39); no hay `http.cors()` en la cadena | Un navegador exige un 2xx en el preflight: el frontend **no podrá llamar a la API desde otro origen** (`localhost:3000` o el puerto 3000 de la VM). Con `curl` y Postman no se nota, por eso el backend "funciona" | Fase 3, T2: habilitar `http.cors()` con un `CorsConfigurationSource` (orígenes por variable de entorno, métodos y cabeceras `Authorization` y `Content-Type`). Verificar cómo está publicado en la VM (si el frontend y la API comparten dominio detrás de `nginx`, el problema no aparece allí) |
| H-31 | `devInfo` devuelve el *stack trace* completo en desarrollo | Respuesta 401 y 404 locales | Ninguno en producción (`dev.info.enabled=false` en `mysqlprod`); el frontend **no debe mostrar `devInfo`**, solo `message` | Regla para la Fase 4 |

## 6. Estado final de la Fase 0

| Tarea | Estado |
|---|---|
| T1 Frontend: `npm ci`, lint, test, build | Hecho (con Next 16.4.6) |
| T2 Documentación de Next.js en `node_modules/next/dist/docs/` | **Pendiente**: se lee al empezar la Fase 4, antes de escribir código de Next |
| T3 Backend local y login | Hecho |
| T4 Tests del backend y Postman | Hecho |
| T5 Informe | Este documento |

## 7. Guía de defensa (parte frontend de la línea base)

1. ¿Qué tecnologías usa el frontend y por qué hay un `Dockerfile` con tres etapas? (Next 16 con salida `standalone`: imagen mínima que solo trae el servidor.)
2. ¿Por qué `NEXT_PUBLIC_API_URL` se pasa como `ARG` en el *build* y no al ejecutar el contenedor? (Las variables `NEXT_PUBLIC_*` se incrustan en el JavaScript al compilar.)
3. ¿Qué cubren hoy los tests y qué no? (Solo cálculos de ETA, tiempo y conciliación; nada de red, autenticación ni pantallas.)
4. ¿Qué hace el CI del frontend y cuándo despliega? (Lint y tests en cada PR a `main`; build de la imagen, copia por SCP y reinicio del contenedor solo en push a `main`.)
5. ¿Por qué el frontend heredado "funcionaba" sin backend? (Cada llamada tiene un `catch` que cae a un mock en memoria.)
6. ¿Qué diferencia hay entre una advertencia de lint y un error, y por qué las 13 de `any` importan? (No rompen el build, pero ocultan los tipos de los errores de red.)
7. ¿Qué es un aviso de `npm audit` y cómo se decide si aplica? (Se lee el aviso y se comprueba si el proyecto usa la función afectada.)
8. ¿Por qué se mide antes de cambiar? (Para poder demostrar que cada fase mejora algo concreto y no rompe lo anterior.)
9. ¿Qué es el *preflight* de CORS y por qué el backend lo rechaza hoy? (El navegador manda un `OPTIONS` antes de un `fetch` con `Authorization` entre orígenes distintos; la cadena de Spring Security lo trata como una petición sin token y responde 401, porque falta `http.cors()`.)
10. ¿Por qué `curl` y Postman no detectan ese problema? (No son navegadores: no hacen preflight ni aplican la política de mismo origen.)
11. ¿Qué diferencia hay entre `addCorsMappings` (MVC) y `http.cors()` (Security)? (El primero configura Spring MVC, que corre después de los filtros de seguridad; el segundo agrega el `CorsFilter` dentro de la cadena, antes de la autorización.)
12. ¿Por qué el frontend no debe mostrar `devInfo`? (Contiene el *stack trace* en desarrollo; es información interna y en producción está apagada.)
13. ¿Qué cambió al actualizar Next y cómo se comprobó que no rompió nada? (Solo dos versiones exactas; se repitieron lint, tests y build, y `npm audit` dejó de marcar `next`.)
