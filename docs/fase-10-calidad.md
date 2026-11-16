# Fase 10 — Calidad, documentación y ensayo de defensa

**Rama:** `fase-10-calidad` (desde `main`, `5ef94ea`) · **Fecha:** 13/11/2026 · **Estado:** implementada y probada en lo que **no** toca la VM (sin commitear al escribir este informe)
**Objetivo:** cerrar el frontend con una revisión transversal de calidad, pruebas que protejan las reglas del proyecto, la documentación y la guía para rendir.
**Alcance acordado:** T1, T2, T6 y T7. Las tareas que tocan la VM (T3 despliegue, T4 variables y datos, T5 prueba de punta a punta allá) **quedaron fuera** por decisión del usuario; de T3 se hizo solo el análisis de la configuración del repositorio, sin acceder a la VM.

## 1. Qué se hizo

| Tarea del plan | Resultado |
|---|---|
| T1 · Revisión transversal | Accesibilidad con **axe-core** (WCAG 2.0/2.1 A y AA) en **10 pantallas × 2 tamaños** (escritorio 1400 px y móvil 390 px): se encontraron **2 problemas** y se corrigieron; ahora **0 violaciones y 0 pantallas con desborde horizontal**. Estados de **error** (backend caído desde la primera carga) y **vacío** verificados en las 6 pantallas con datos: 15 comprobaciones, 0 fallas. `any`, `console`, supresiones de lint y `TODO`: 0 |
| T2 · Pruebas | 19 tests nuevos (181 en total): `formatters.test.mjs` (10) y `architecture.test.mjs` (9, ver 2.2). 6 mutaciones detectadas |
| T3 · Despliegue (solo análisis, sin tocar la VM) | Ver la sección 4: la configuración del repositorio es coherente; el riesgo de contenido mixto y lo que falta configurar en la VM quedaron documentados |
| T4 y T5 | **No se hicieron** (requieren acceso a la VM): ver la sección 6 |
| T6 · README y guía de estudio | `README.md` actualizado (roles, backend local, usuarios de desarrollo, pruebas, índice de documentación) y **`docs/guia-de-estudio.md`** nueva |
| T7 · Ensayo de defensa | En la guía: 28 preguntas cruzadas (roles y seguridad, alarmas, órdenes y tiempo, conciliación, arquitectura), el guion de una demostración de 10 minutos y los límites conocidos |

Además: se corrigieron los **enlaces rotos** de los informes de las Fases 7 y 8 (apuntaban a `file:///home/joa/…`, una ruta de otra máquina) y se borró el envoltorio `formatDateTime` heredado, que nadie usaba.

### Archivos tocados

| Archivo | Motivo |
|---|---|
| `src/components/shared/sidebar.tsx` | Accesibilidad: quitar el `aria-label` del logo (no contenía el texto visible) y la opacidad de los números del menú (contraste) |
| `src/lib/formatters.ts` | Se quitó `formatDateTime` (sin uso) y su import, para que el módulo sea testeable |
| `src/lib/formatters.test.mjs`, `src/architecture.test.mjs` | Pruebas nuevas |
| `docs/guia-de-estudio.md`, `docs/fase-10-calidad.md`, `README.md` | Documentación |
| `docs/fase-7-conciliacion.md`, `docs/fase-8-alarmas.md` | Enlaces relativos y filas desactualizadas |
| `CLAUDE.md`, `docs/plan-de-trabajo.md` | Estado de la Fase 10 |

## 2. Detalle

### 2.1 Accesibilidad y responsive

Se recorrieron `/login`, `/`, `/orders`, el detalle de una orden en los estados 1, 2 y 4, la conciliación, `/alarms` (con la pestaña de configuración) y `/simulator`, con sesión de ADMIN. Hallazgos y arreglos:

| Hallazgo | Dónde | Arreglo |
|---|---|---|
| `color-contrast` (grave) | Números «01 … 04» del menú lateral de escritorio (opacidad 60 %) | Sin opacidad |
| `label-content-name-mismatch` (grave) | Enlace del logo en el menú lateral: `aria-label` «AetherLoad · Inicio» no contenía el texto visible | Se quitó el `aria-label`; el nombre accesible es el texto visible |

Sin problemas: idioma (`lang="es"`), un `h1` y un `main` por pantalla, enlace «Saltar al contenido», sin desborde horizontal a 390 px. **No se evaluó** la navegación solo con teclado ni lectores de pantalla (axe cubre las reglas automatizables, no todo).

### 2.2 `architecture.test.mjs`: las reglas del proyecto las comprueba el CI

Recorre `src/` (sin comentarios) y falla si reaparece algo que `CLAUDE.md` prohíbe: el mock (`services/mock` o `MockStore`), tokens o credenciales en el código (`demo-jwt`, `admin123`…), `any` explícito, `@ts-ignore` o `eslint-disable`, `console.*`, `process.env` fuera del cliente HTTP (y que se lea como `process.env.NEXT_PUBLIC_API_URL` literal), `fetch` fuera del cliente HTTP, `devInfo` en alguna pantalla y `catch` vacíos. Cada regla se probó metiendo la infracción a propósito (mutaciones, sección 3).

## 3. Pruebas ejecutadas (13/11/2026)

| Prueba | Resultado |
|---|---|
| `npx tsc --noEmit` | sin errores |
| `npm run lint` | 0 errores, 0 advertencias |
| `npm test` (Node 24 local) | **181 tests, 0 fallas** (162 + 19 nuevos) |
| Mutaciones | 6 de 6 detectadas: un `any`, un `console.log`, una credencial, un `fetch` directo, un `catch` vacío y `formatKg(null)` devolviendo «0 kg» |
| `npm run build` | compila; 10 rutas |
| axe-core, 10 pantallas × 2 tamaños | antes: 2 reglas violadas en 9 pantallas de escritorio; **después: 0** |
| Estados de error y vacío | 15 comprobaciones, 0 fallas |
| `npm audit` | 7 avisos **moderados**, todos de herramientas de desarrollo (`typescript-eslint` → `minimatch`); no llegan al código que se despliega. `next` no figura |
| Réplica del CI (copia limpia, npm 10, Node 22) | ver 3.1 |

### 3.1 Réplica del CI

Copia limpia del árbol de trabajo (sin `node_modules`, `.next` ni `.git`): `npm ci` con **npm 10** correcto, lint sin avisos, build correcto y los **181 tests también con Node 22.23** (el del CI). El lint y el build se corrieron con Node 24; los tests, con ambas versiones.

## 4. Despliegue: análisis de la configuración (sin acceso a la VM)

- **Cómo se publica:** al hacer push a `main`, GitHub Actions corre lint y tests y, si pasan, compila la imagen Docker **en el runner** con `--build-arg NEXT_PUBLIC_API_URL=…`, la copia a la VM por SCP y reinicia el contenedor `iw3-frontend` (puerto 3000).
- **La URL de la API queda fija al compilar.** Sin el secreto `NEXT_PUBLIC_API_URL` se usa `http://143.0.100.187:8080/api/v1`. Cambiar la dirección de la API exige volver a compilar.
- **CORS:** el backend, sin `CORS_ALLOWED_ORIGINS`, acepta cualquier origen (`*`); por eso el frontend desplegado puede llamarlo. Es seguro frente a CSRF porque el token viaja en un header y no en una cookie, pero en producción conviene limitarlo al origen del frontend.
- **Contenido mixto (riesgo):** hoy el sitio se sirve por HTTP (`http://143.0.100.187:3000`) y llama a la API por HTTP, así que funciona. **Si se sirviera por HTTPS** (por ejemplo, por el dominio `https://jc755.duckdns.org`) y la API siguiera en HTTP, el navegador bloquearía los pedidos. En ese caso hay que compilar con una `NEXT_PUBLIC_API_URL` HTTPS. Al consultar el dominio HTTPS desde afuera respondió 401 (probablemente una protección del servidor web); **no se investigó**.
- **Lo que no está en el repositorio y hay que configurar en la VM** (con autorización): `JWT_SECRET`, `CORS_ALLOWED_ORIGINS`, usuarios por rol y credenciales SMTP.

## 5. Limitaciones

- La revisión de accesibilidad es **automática** (axe-core): no sustituye una prueba con teclado y lector de pantalla.
- `architecture.test.mjs` busca patrones de texto: no entiende el código. Detecta lo que `CLAUDE.md` prohíbe en su forma habitual, no todas las formas posibles.
- Los avisos moderados de `npm audit` quedan abiertos (son de desarrollo); corregirlos implicaría cambiar `typescript-eslint`/`eslint-config-next`.
- Los títulos de pestaña son iguales en todas las pantallas («AetherLoad · Control de carga de gas»); es válido, pero uno por pantalla ayudaría. No se cambió.

## 6. Lo que queda fuera de esta fase (y es del equipo)

| Pendiente | Por qué no se hizo |
|---|---|
| Despliegue y prueba de punta a punta **en la VM** (T3 a T5) | Requiere acceso a la VM y autorización; decisión del usuario |
| Configurar `JWT_SECRET`, CORS, usuarios por rol y **SMTP real** en la VM | Idem; además, probar el correo con una cuenta real (D-12) |
| Limpiar los 120 commits con coautor de Claude del `main` del backend | Exige `push --force` y coordinar con el equipo; el usuario lo dejó para el final |
| Ensayo de defensa **con personas** | La guía deja las preguntas y las respuestas; el ensayo oral lo hace el equipo |

## 7. Guía de defensa de esta fase

1. **¿Qué cubre la revisión de accesibilidad y qué no?** Cubre las reglas automatizables de WCAG 2.0/2.1 A y AA (contraste, nombres accesibles, etiquetas, idioma, estructura) en todas las pantallas y dos tamaños. No cubre navegación con teclado ni lectores de pantalla.
2. **¿Qué problemas encontró y cómo se arreglaron?** Dos en el menú lateral: el contraste de los números (opacidad 60 %) y un `aria-label` que no contenía el texto visible; se quitaron ambos.
3. **¿Para qué sirve `architecture.test.mjs`?** Para que el CI haga cumplir las reglas del proyecto: sin mock, sin `any`, sin credenciales, sin `fetch` fuera del cliente HTTP, sin `console`, sin `catch` vacíos y con la URL de la API leída de la forma que Next incrusta.
4. **¿Cómo se sabe que esos tests detectan algo?** Se metió cada infracción a propósito (mutación) y el test falló las seis veces.
5. **¿Por qué importa `process.env.NEXT_PUBLIC_API_URL` literal?** Next solo reemplaza ese acceso estático al compilar; `process.env[nombre]` quedaría `undefined` en el navegador.
6. **¿Qué pasa si el backend está caído al abrir una pantalla?** Muestra el error real de conexión (no queda cargando ni en blanco); lo verificó una prueba en las 6 pantallas con datos.
7. **¿Cómo se publica el frontend y qué hay que cuidar?** Push a `main` → lint y tests → imagen Docker con la URL de la API fija → VM. Hay que cuidar que la URL sea HTTPS si el sitio se sirve por HTTPS (contenido mixto) y configurar en la VM los secretos que no están en el repositorio.
8. **¿Qué quedó sin probar?** El despliegue completo en la VM, el correo con una cuenta SMTP real y la accesibilidad con teclado y lector de pantalla.

**Qué debe poder explicar cada integrante:** qué se revisó y qué no, por qué las reglas del proyecto las comprueba el CI, y qué falta hacer en la VM.
