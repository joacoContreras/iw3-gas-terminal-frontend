# AetherLoad — Terminal de carga de gas

<img src="public/brand/aetherload-logo.png" alt="AetherLoad" width="180" />

Identidad visual, componentes y reglas de accesibilidad: [guía de estilos](docs/styling.txt). Implementación y verificaciones: [estilos de AetherLoad](docs/estilos-aetherload.md).

Interfaz web interactiva orientada a la visualización y control operativo del circuito de carga de gas líquido en planta. Diseñada con Next.js (App Router), componentes modulares y gestión de estado para garantizar sincronización en tiempo real.

### Funcionalidades clave:
* **Tablero de control y monitoreo:** Listado dinámico de órdenes con soporte de filtros por estado operativo, detalles de camión, chofer y variables en vivo (masa acumulada, caudal, densidad y temperatura).
* **Cálculo de ETA en tiempo real:** Estimación automática del tiempo restante de llenado según el preset fijado, la masa acumulada y la tasa de caudal.
* **Gestión de alarmas térmicas:** Notificación visual ante desvíos de temperatura configurados en planta y panel de aceptación/reconocimiento para operadores autorizados.
* **Módulo de conciliación:** Consulta y renderizado analítico del balance final de carga para órdenes en estado completado.
* **Seguridad y experiencia de usuario:** Rutas protegidas mediante autenticación (JWT del backend) y roles, diseño responsivo y feedback interactivo ante estados de carga (*loading*, *empty states* y manejo de errores).
* **Simulador de integración (solo ADMIN):** recorre desde la interfaz el circuito completo (SAP → tara y PIN → activación → lecturas → cierre → pesaje final) contra el backend real.

---

## Stack Tecnológico

- **Framework:** [Next.js](https://nextjs.org/) (App Router) + [React](https://react.dev/)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/) (modo estricto, sin `any`)
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
- **Iconos y Utilidades:** [Lucide Icons](https://lucide.dev/) + helper `cn` en `src/lib/utils.ts`

---

## Primeros Pasos

Copiá `.env.example` a `.env.local` y ajustá la dirección del backend (no tiene valor por defecto; sin ella el cliente HTTP falla con un mensaje claro):

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

`NEXT_PUBLIC_API_URL` se **incrusta al compilar**: en producción se pasa como `--build-arg` al `docker build` (ver el `Dockerfile` y el workflow). El backend se levanta desde su repo (`iw3-gas-terminal-backend`) y el contrato de la API está en `docs/contrato-api.md`.

Para iniciar el servidor de desarrollo:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para interactuar con la aplicación.

### Scripts Disponibles

* `npm run dev`: Inicia el servidor local de desarrollo.
* `npm run build`: Compila y genera el bundle optimizado para producción.
* `npm run start`: Ejecuta el servidor en modo producción.
* `npm run lint`: Ejecuta el linter ESLint para análisis de código.
* `npm test`: Ejecuta las pruebas unitarias (todos los `*.test.mjs`) con el ejecutor de Node.
* `npm run lint`, `npm test` y `npm run build` son los tres chequeos que corre el CI en cada Pull Request (Node 22 y npm 10).

---

## Backend y usuarios de desarrollo

El backend vive en el repositorio hermano `iw3-gas-terminal-backend` (Java 21, Spring Boot 4.1, MySQL 8). En local:

```bash
cd ../iw3-gas-terminal-backend && docker compose up -d
./mvnw spring-boot:run -Dspring-boot.run.profiles=mysqldev      # http://localhost:8080
```

Los usuarios de prueba se cargan con `docs/sql/seed-dev-users.sql` del backend (**solo desarrollo**): `admin / admin123` y `supervisor`, `operador`, `sap`, `tms`, `loader` con contraseña `<usuario>123`. No hay credenciales en el código del frontend.

### Qué puede hacer cada rol

| Rol | Pantallas y acciones |
|---|---|
| `ADMIN` | Todo: órdenes, alarmas (aceptar y editar la configuración) y simulador |
| `SUPERVISOR` | Órdenes (ver y cerrar), alarmas (ver y aceptar) y configuración en solo lectura |
| `OPERADOR` | Órdenes (ver y cerrar) y alarmas (solo ver) |
| `SAP`, `TMS`, `LOADER`, `USER` | Sin pantallas (los sistemas externos usan solo la API) |

La interfaz oculta lo que el rol no permite, pero **la API siempre decide** (responde 403).

---

## Pruebas

* `npm test`: pruebas unitarias de la lógica (JWT y sesión, permisos contra la matriz del contrato, ETA y tiempo transcurrido, fechas en hora de Argentina, formato, validaciones de alarmas, conciliación) y `src/architecture.test.mjs`, que hace fallar el CI si vuelve un mock, un `any`, un `console`, una credencial en el código o un `fetch` fuera del cliente HTTP.
* Pruebas con navegador real contra el backend real: ver `docs/verificacion-main-13-11-2026.md`.

---

## Documentación

* `CLAUDE.md`: estado del proyecto, reglas de trabajo y decisiones de diseño.
* `docs/plan-de-trabajo.md`: plan por fases y su estado.
* `docs/contrato-api.md`: contrato real del backend (rutas, roles, ejemplos).
* `docs/fase-4-conexion.md` a `docs/fase-10-calidad.md`: un informe por fase, con su guía de defensa.
* **`docs/guia-de-estudio.md`: guía para la defensa** (flujos punto por punto y preguntas cruzadas).
* `docs/estilos-aetherload.md` y `docs/styling.txt`: identidad visual.
