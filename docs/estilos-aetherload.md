# Aplicación de la identidad AetherLoad

Fecha: 13/11/2026. Rama: `estilos-aetherload`, creada desde el estado que incluye la fase 9 (`b0cce44`). Trabajo visual solicitado expresamente por el usuario. No se realizaron commits, push ni despliegue y no se declara completada la fase 10.

## Guía formal

La referencia es [styling.txt](styling.txt), reescrita como guía de versión 1.0. Incluye alcance, identidad, uso del logo, tabla de tokens, tipografía, composición, estados interactivos, tablas, formularios, navegación móvil, impresión y criterios de aceptación.

La implementación concreta dos detalles que el documento inicial dejaba abiertos:

- **Tipografía:** Geist Sans y Geist Mono, ya incluidas en el proyecto con `next/font`. Se corrige el `font-family: Arial` que anulaba su uso efectivo.
- **Contraste de alarma:** se mantiene `danger: #FB7185` para la identidad y se incorpora `danger-ink: #FFB4BF` para texto. La medición inicial encontró que el color original perdía contraste en etiquetas superpuestas sobre filas teñidas de rojo; la variante clara resuelve ese caso.

## Qué cambió

| Grupo | Cambios |
|---|---|
| `src/app/globals.css` | Paleta única con variables y `@theme inline`; tema oscuro estable, tipografía, foco, campos, tablas, progreso, reducción de movimiento y reglas de impresión. |
| `src/app/layout.tsx` | Nombre AetherLoad, metadatos e icono del sistema. Se retira el favicon genérico anterior. |
| `public/brand/aetherload-logo.png` | Copia exacta del logo proporcionado, cuyo original se conserva en `res/`. Sin recortes, transformaciones ni imágenes generadas. |
| `src/components/shared/brand.tsx` | Identificación reutilizable con `next/image`, proporción reservada y nombre en texto. |
| `navbar.tsx`, `sidebar.tsx`, `dashboard-shell.tsx` | Barra lateral de 240 px, encabezado compacto, sección actual, usuario/rol, contador de alarmas, navegación activa y enlace para saltar al contenido. Menú móvil con diálogo nativo, Escape y cierre al cambiar a escritorio. Se elimina información técnica de implementación de la navegación de producto. |
| `src/components/ui/*` | Botones de acento con texto oscuro y ancho estable durante carga; tarjetas, campos, selectores, badges, progreso y modal alineados con la guía. Los errores de campo se vinculan mediante ARIA. |
| Acceso | Composición con logo original, retícula y ondas discretas en escritorio; formulario de una columna en móvil. Conserva login y errores reales. |
| Dashboard y órdenes | Jerarquía de títulos y métricas, estados con colores semánticos, telemetría y progreso de marca. Tablas desplazables con cabecera fija; filtros visibles y acción para limpiarlos. |
| Alarmas | Banner y estados legibles sin parpadeo continuo, colores de error con contraste suficiente, configuración y diálogo de aceptación con etiquetas asociadas a sus campos. |
| Simulador | Formularios SAP, TMS y carga con las mismas superficies, campos, foco, acciones y mensajes. Se conservan el PIN, las confirmaciones y todos los endpoints reales. |
| Conciliación | Paneles oscuros y comprobante claro con AetherLoad. Impresión sin navegación, banner ni acciones; mejor adaptación del encabezado del remito en móvil. |
| `src/app/not-found.tsx` y vista de permisos | Página 404 propia en español e identidad coherente para estados sin permisos. |
| `README.md`, `CLAUDE.md` | Nombre, recurso de marca y enlaces a la guía para mantener las convenciones en cambios futuros. |

La migración sustituye las clases de color anteriores por tokens semánticos en las pantallas. No redefine globalmente las utilidades `zinc`, `blue` o `violet` para simular un cambio de tema. La paleta clara del comprobante es una excepción explícita de impresión. No se agregaron dependencias ni se modificaron cliente HTTP, contratos, servicios, lógica de cálculo o permisos del backend.

## Validación ejecutada

| Comprobación | Resultado |
|---|---|
| `npm run lint` | 0 errores y 0 advertencias. |
| `npm test` | **162 pruebas, 37 suites, 0 fallas.** Se conservó la suite de lógica existente. |
| `npx tsc --noEmit` | Correcto durante la implementación; el build final volvió a comprobar tipos correctamente. |
| `npm run build` | Compilación correcta de las 10 páginas. Persiste únicamente el aviso de un lockfile ajeno en `/home/joa/repos`, fuera del repositorio. |
| Chrome con Playwright y compilación de producción | **44 comprobaciones correctas** contra Spring Boot y MySQL locales. |
| Revisión de contraste textual | Sin incidencias detectadas en acceso, dashboard, listado, detalle, conciliación, alarmas, simulador, 404, configuración, modal y pantalla sin permisos, después de corregir el texto de alarma. |
| `git diff --check` | Correcto. |
| Recurso de marca | El archivo servido es idéntico al original. El logo, el nombre y el icono de pestaña cargan correctamente. |

### Recorrido del navegador

Se inició el backend existente de `/home/joa/repos/iw3` mediante Spring Boot con perfil `mysqldev` y se sirvió el frontend usando `.next/standalone/server.js`. Se usaron los datos y usuarios locales existentes, sin crear órdenes, aceptar alarmas ni modificar su configuración durante esta revisión visual. Al terminar se detuvieron los servidores temporales de frontend y backend; MySQL quedó como estaba.

Se comprobó:

1. Acceso con identidad propia, carga del logo e icono de pestaña; preferencia clara del sistema manteniendo el tema AetherLoad.
2. Error real de login y entrada válida como ADMIN. El botón conserva su ancho.
3. Dashboard, listado, detalle de orden, conciliación, alarmas y simulador con datos del backend. Sin desbordamiento horizontal de página en escritorio.
4. Las mismas seis pantallas y la página 404 a 390 px, sin desbordamiento horizontal de página; las tablas contienen su propio desplazamiento.
5. Filtros de estado y acción de limpieza. Etiqueta accesible del umbral de alarmas.
6. Apertura del modal de alarma sin aceptar la alarma; foco dentro del diálogo y cierre con Escape.
7. Menú móvil con foco contenido, cierre mediante Escape y navegación a órdenes. Al pasar a escritorio, se cierra y se libera el scroll.
8. Acceso móvil con preferencia oscura y movimiento reducido; foco y borde turquesa en el campo activo.
9. Conciliación en modo impresión: encabezado y barra lateral ocultos, comprobante visible y PDF generado.
10. Login real como OPERADOR y acceso directo a `/simulator`: pantalla sin permisos con la nueva identidad.
11. Sin errores JavaScript durante el recorrido.

Se inspeccionaron capturas de escritorio, móvil y modal. La automatización, las capturas y el PDF se generaron temporalmente en `/tmp/aetherload-review/`; no forman parte del CI ni agregan paquetes al proyecto.

### Referencias de contraste

Ratios calculados desde los valores de la guía:

| Combinación | Ratio |
|---|---|
| Texto principal sobre panel | 11,94:1 |
| Texto secundario sobre panel | 6,94:1 |
| Texto secundario sobre superficie elevada | 5,64:1 |
| Texto oscuro sobre botón turquesa | 9,96:1 |
| Borde de campo sobre su fondo | 3,16:1 |

La revisión automatizada de texto combina colores computados y fondos de los elementos inspeccionados. Es una verificación de estas vistas y estados, no una certificación integral de accesibilidad. No se realizó una auditoría con lector de pantalla ni una comparación entre todos los motores de navegador.

## Uso y mantenimiento

- Consultar primero `styling.txt` y reutilizar `Brand`, `Button`, `Card`, `Input`, `Select`, `Badge` y `Modal`.
- Usar `control-input` para controles nativos que no pasan por los componentes compartidos; `aether-table` para tablas operativas.
- Usar texto `danger-ink` sobre superficies oscuras y tintes de error; reservar el color `danger` para fondos, bordes e indicadores.
- Mantener los mensajes del backend y los estados de datos ausentes. El tema visual no crea información de conexión ni altera los permisos.
- Al agregar una pantalla, revisar móvil, teclado, estado de error, tabla desplazable y contraste. El remito debe conservar su excepción clara y su aislamiento de impresión.
