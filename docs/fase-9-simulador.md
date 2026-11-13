# Fase 9 — Simulador de integración real

Fecha: 13/11/2026. Rama: `fase-9-simulador`. Alcance: completar el trabajo interrumpido del simulador, conservar las fases anteriores e integrar los Puntos 1 a 5 contra Spring Boot. Integrada en `main` por el PR #7 (13/11/2026) y desplegada.

## Resultado y decisiones

El simulador permite crear una orden SAP, registrar tara, copiar el PIN entregado por TMS, activar la carga, enviar lecturas, disparar una alarma, cerrar la orden y recibir la conciliación del pesaje final. Es una herramienta de demostración para ADMIN: los datos de ejemplo del formulario son editables y cada envío modifica el backend real.

| Tarea | Implementación |
|---|---|
| T1 · SAP | Formulario con número, preset, fecha prevista en hora de Argentina, cuatro códigos externos, camión con cisternas editables, chofer, cliente, contacto, producto y descripciones. Procesa el 201 vacío. Los errores 302 y 400 conservan el mensaje del backend y muestran el estado HTTP. |
| T2 · Tara | Envía únicamente `{ weight }`. Muestra el PIN y el número de la orden que lo recibió, aunque el selector pase a otra orden tras sincronizarse. No guarda el PIN en almacenamiento persistente. |
| T3 · Carga | Activa con `{ orderNumber, password }` y muestra el preset devuelto. Permite probar PIN incorrecto (403), ajustar temperatura, caudal y densidad, enviar incrementos manuales o bombear automáticamente. Muestra `saved` y `reason`, progreso confirmado y errores de red/backend. |
| T4 · Pesaje final | Envía `{ weight }` y muestra los ocho valores de la conciliación devuelta, además del enlace al remito. Promedios nulos aparecen como «Sin datos». |
| T5 · Acceso | Se conserva `simulator:use` exclusivo de ADMIN, aplicado en navegación y en el layout de `/simulator`. Los roles externos conservan sus permisos de API; no acceden a esta herramienta completa. |
| T6 · Retiro del respaldo | Se eliminan el almacén en memoria, servicio/hook heredados y tipos antiguos. Los servicios usan exclusivamente `apiClient`/`apiRequest`. También se elimina el `catch(() => null)` que escondía errores de configuración en `useAlarms`. |
| T7 · Verificación y documentación | Recorrido desde Chrome con Spring Boot y MySQL locales; SMTP local para capturar el envío real del backend. Informe y guía en este archivo. |

### Bombeo y sincronización

- Los selectores consultan los estados 1, 2 y 3 al servidor y recorren **todas** sus páginas de hasta 100 órdenes. No incluyen finalizadas ni limitan silenciosamente el circuito a las primeras 100 órdenes globales. El polling conserva el último dato junto al error, se pausa al ocultar la pestaña y se cancela al desmontar.
- Cada sesión de bombeo tiene una clave por `orderNumber`. Cambiar de orden desmonta la sesión anterior: descarta PIN ingresado, validación, timer, errores y progreso local. Una activación histórica no reemplaza la validación del PIN en la nueva sesión; el backend permite repetir esa activación de forma idempotente.
- Un bloqueo por referencia impide envíos superpuestos y dobles clics antes del siguiente render. El timer usa `setTimeout` después de terminar la petición; se detiene ante descarte, error, pausa, preset alcanzado o desmontaje. Una petición ya enviada puede terminar después de pausar: no se programa otra.
- La próxima masa usa el máximo entre la última masa del servidor y la última aceptada en esta sesión. Así un polling atrasado no repite ni reduce la carga. Un `saved: false` no avanza el progreso.
- El automático convierte `kg/h × 1500 ms / 3.600.000` a kg por intervalo. Con 12.000 kg/h agrega 5 kg por envío. La latencia de red se suma entre envíos: es una simulación por intervalos, no un controlador físico. Los botones +500/+2.000 kg aceleran explícitamente la demostración y el último incremento se limita al preset.
- Cerrar exige confirmación e impide nuevos envíos mientras se procesa. El backend decide si la transición es válida. El cierre parcial sigue siendo posible, como permite el contrato.
- El umbral mostrado se consulta en `/alarms/config`; no se presupone 25 °C. La alarma y el envío de correo pertenecen al backend. El simulador enlaza la gestión de alarmas para comprobar `emailSentAt` y aceptar la alarma con auditoría.

## Archivos y responsabilidades

| Archivo | Motivo |
|---|---|
| `src/app/(dashboard)/simulator/page.tsx` | Rotulado de demostración, guía, carga/vacío/error y sincronización de selectores. |
| `src/features/simulator/services/simulatorApi.ts` | Seis operaciones reales de integración con los tipos oficiales. Sin respaldos sintéticos. |
| `src/features/simulator/hooks/useSimulatorOrders.ts` | Polling del listado completo de órdenes activas. |
| `src/features/simulator/lib/simulation.ts` y `.test.mjs` | Masa creciente, conversión de caudal y recorrido de páginas; 10 pruebas de regresión. |
| `src/features/simulator/components/sap-order-generator.tsx` | Formulario completo, cisternas dinámicas y errores SAP. |
| `src/features/simulator/components/tms-scale-control.tsx` | Tara con comprobante de PIN asociado a la orden y pesaje final con conciliación recibida. |
| `src/features/simulator/components/pump-streamer.tsx` | Activación, sesiones por orden, telemetría serializada, controles físicos, progreso y cierre confirmado. |
| `src/features/alarms/hooks/useAlarms.ts` | Propaga el error de configuración en lugar de sustituirlo por `null`. |
| `src/types/index.ts` | Reexporta exclusivamente los tipos reales de `src/types/api`. |
| Eliminados: `useLegacyOrders.ts`, `legacyOrdersApi.ts`, `src/services/mock/mockStore.ts`, `src/types/{alarm,entities,order,reconciliation,telemetry}.ts` | Ya no hay consumidores de estos contratos imaginados ni del almacén en memoria. |
| `CLAUDE.md`, `docs/plan-de-trabajo.md`, este informe | Estado de la fase y memoria para continuar con la fase 10 cuando se autorice. |

No se modificó código del backend. Se configuró `.env.local` ignorado por Git con la API local. `npm ci` alineó `node_modules` con Next 16.4.6 del lockfile; la instalación anterior tenía 16.4.0. No se cambió el manifiesto ni el lockfile.

## Recorrido de los datos, paso a paso

1. **Selección de órdenes:** `useSimulatorOrders.ts:14` invoca `loadSimulatorOrders` (`simulation.ts:17`) mediante `usePolling`. `ordersApi` pide cada página con `status`, `page` y `size`. El resultado actualiza los tres selectores por número de orden.
2. **SAP:** `sap-order-generator.tsx:20` lee el formulario, arma `SapOrderRequest` y conserva la hora ingresada de Argentina sin convertirla a UTC. `createSapOrder` llama a `/integration/sap/orders`. El backend asigna estado 1; el 201 muestra éxito y provoca una nueva consulta de órdenes.
3. **Tara:** `tms-scale-control.tsx:40` llama a `registerTare(n, weight)`. TMS pasa la orden a estado 2 y devuelve `activationPassword`. El comprobante conserva `{ orderNumber, pin }`; la contraseña no se obtiene de un GET de órdenes.
4. **Activación:** `pump-streamer.tsx:80` llama a `activateLoader(n, Number(pin))`. Solo una respuesta exitosa habilita lecturas y fija el preset. Un 403 muestra el mensaje real y mantiene la sesión del usuario.
5. **Lecturas:** `pump-streamer.tsx:100` calcula la masa creciente mediante `nextAccumulatedMass` (`simulation.ts:5`) y envía los cuatro atributos físicos. Solo `saved: true` confirma masa local. El polling muestra los cambios en las demás pantallas.
6. **Alarma:** una lectura válida sobre el umbral provoca la alarma en Spring Boot. El banner global la detecta por polling. El usuario la acepta desde el modal; el backend identifica al responsable por el JWT. `emailSentAt` permite comprobar el correo, independientemente del resultado de la lectura.
7. **Cierre:** `pump-streamer.tsx:140` envía el cierre sin cuerpo después de confirmar. El backend pasa a estado 3; la orden aparece en el selector de pesaje final.
8. **Pesaje final:** `tms-scale-control.tsx:63` llama a `registerFinalWeight`. El backend pasa a estado 4 y devuelve `Reconciliation`; el componente la conserva y la presenta directamente (`:254`). El enlace abre el remito de la fase 7.

## Pruebas ejecutadas

| Verificación | Resultado |
|---|---|
| `npm ci` | Instalación correcta desde el lockfile; Next 16.4.6. |
| `npm run lint` | 0 errores y 0 advertencias. |
| `npm test` | 162 pruebas, 37 suites, 0 fallas. Se agregaron 10 pruebas sobre masa, caudal, paginación completa, deduplicación, errores y cancelación. |
| `npx tsc --noEmit` | 0 errores. La compilación final también ejecutó TypeScript correctamente. |
| `npm run build` | Compilación de producción correcta; 10 páginas generadas. Persiste el aviso del lockfile ajeno en `/home/joa/repos`, fuera de este repositorio. |
| Chrome/Playwright contra Spring Boot y MySQL reales | **70 verificaciones correctas** con la compilación de producción servida mediante `.next/standalone/server.js`. |
| Auditoría de respaldo | Sin imports ni referencias a `MockStore`, `mockStore`, `services/mock`, `legacyOrdersApi`, `useLegacyOrders` o los tipos eliminados en `src`. `git diff --check` correcto. |

### Escenario de navegador ejecutado

Se levantó Spring Boot con `mysqldev` desde `/home/joa/repos/iw3`, se usó la base MySQL local existente y se ejecutó su seed de usuarios de desarrollo. SMTP se configuró **solo en el proceso de prueba** con host `127.0.0.1`, puerto 1025, sin autenticación ni STARTTLS, apuntando a un capturador local. Los destinatarios se configuraron desde la UI y la configuración original de alarmas se restauró al finalizar. No se modificó código ni archivos de configuración del backend. La base local conserva los usuarios y datos de prueba creados, incluidos intentos previos de la automatización.

La ejecución final completó las órdenes **1794575929** y **1794575930**, ambas en estado 4:

- Login real por formulario y redirección al login al intentar entrar sin sesión.
- SAP 201 con dos cisternas editadas; 400 por número de cisterna repetido y 302 por orden existente, con sus mensajes reales visibles.
- Fecha `2026-12-01T08:30:00` conservada como hora de Argentina aun usando un navegador con zona UTC.
- Tara real y comprobante con PIN; el GET de la orden no lo expone. PIN incorrecto devuelve 403 visible y conserva la sesión; PIN correcto devuelve el preset.
- Densidad 1,2 provoca `saved: false`, sin masa guardada ni alarma. Corregirla a 0,535 permite guardar la lectura.
- Temperatura de 31 °C con umbral vigente de 30 °C: aparece el banner, el SMTP local recibe **un mensaje** y el backend registra `emailSentAt`. Varias lecturas sobre el umbral no generan otro correo mientras la alarma está pendiente.
- Respuesta real de una lectura retardada 1,8 s en el navegador: los controles impiden envíos superpuestos; pausar durante la respuesta evita un siguiente envío. Con caudal 12.000 kg/h, el automático agrega 5 kg. Las masas guardadas de la primera orden fueron 500, 505, 1.005 y 1.500 kg.
- Cambio de orden exige nuevamente el PIN y no reutiliza el progreso de otra sesión. La aceptación de alarma registra `admin` y la observación.
- Cierre confirmado y pesaje final: 400 visible al enviar un bruto menor que la tara; con 16.000 kg se recibe neto 1.500 kg, producto 1.500 kg y diferencia 0.
- Caída de conexión de una lectura: error visible y sin datos inventados. La segunda orden se cierra sin lecturas; bruto igual a tara produce neto 0 y tres promedios «Sin datos».
- Vista de 390 px sin desborde horizontal y sin errores JavaScript durante el recorrido normal. También se inspeccionaron las capturas de escritorio y móvil.
- Fallo de conexión al consultar configuración en `/alarms`: muestra el error, verificando la eliminación del respaldo silencioso a `null`.
- Login real con SUPERVISOR, OPERADOR, SAP, TMS y LOADER: acceso directo a `/simulator` muestra «sin permisos», sin formulario ni polling de órdenes del simulador.

La automatización de navegador y el capturador SMTP fueron herramientas temporales en `/tmp`, sin nuevas dependencias del proyecto. El recorrido manual de este informe permite repetir el escenario. Las pruebas de lógica quedan versionables en `simulation.test.mjs`; el escenario de navegador no se agregó al CI.

## Cómo repetir el circuito manualmente

1. Iniciar MySQL y Spring Boot con el perfil `mysqldev` desde `/home/joa/repos/iw3`; usar los usuarios del seed local. Configurar `NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1` en `.env.local` e iniciar el frontend.
2. Entrar como ADMIN y abrir `/simulator`. Elegir un número nuevo y códigos externos propios de la prueba para evitar actualizar entidades de otras órdenes.
3. Completar fecha prevista, preset 1.500 kg y dos cisternas. Emitir la orden y comprobar que aparece para tara. Repetir el envío para ver el mensaje 302; duplicar el número de cisterna para comprobar el 400.
4. Registrar tara de 14.500 kg y copiar el PIN del comprobante. Seleccionar esa orden en el sistema de carga. Probar primero un PIN incorrecto y después el entregado.
5. Subir la temperatura un grado sobre el umbral mostrado. Enviar una lectura con densidad 1,2 para ver `saved: false`; corregirla a 0,535 y enviar +500 kg para guardar y disparar la alarma.
6. Comprobar el banner, el correo y `emailSentAt`. Varias lecturas sobre el umbral mantienen una única alarma pendiente. Iniciar y pausar el automático para observar incrementos según el caudal. Completar el preset con los botones manuales.
7. Aceptar la alarma con una observación. Cerrar la orden y confirmar. Registrar bruto final de 16.000 kg: neto 1.500, producto 1.500 y diferencia 0. Abrir el remito.
8. Repetir con otro rol: `/simulator` debe mostrar «sin permisos». La API sigue validando JWT y roles independientemente de la interfaz.

## Limitaciones

- No se desplegó ni se accedió a la VM. La prueba es con Spring Boot/MySQL reales en local. La llegada del correo a una casilla externa requiere SMTP real; el servidor local captura el mensaje SMTP del backend, no valida entrega a Internet.
- Los códigos externos sincronizan entidades compartidas en el backend. Los valores del formulario son ejemplos explícitos y editables; se recomienda usar códigos exclusivos para las demostraciones.
- El PIN existe únicamente en la respuesta de la tara y en memoria de la pestaña. Recargar pierde el comprobante; no se inventa una forma de recuperar el PIN desde el detalle.
- Las consultas paginadas por estado no forman una instantánea transaccional. Se deduplican números que aparecen en dos estados durante una transición; un siguiente polling corrige los cambios concurrentes.
- El polling continúa siendo el mecanismo de tiempo real. No hay WebSockets, reintentos automáticos de mutaciones ni envío de correo desde el navegador.

## Guía de defensa

Cada integrante debe poder explicar el circuito anterior, ubicar el servicio HTTP y distinguir datos enviados, respuestas y decisiones del backend.

1. **¿Qué simula esta pantalla?** Los mensajes de los sistemas externos SAP, TMS y carga. Envía solicitudes reales; el backend guarda órdenes, pesajes y lecturas en MySQL. No simula respuestas exitosas.
2. **¿Por qué ADMIN y no SAP, TMS o LOADER?** Cada rol externo tiene acceso a su parte del circuito. La pantalla reúne todas esas operaciones y consulta órdenes; el permiso completo se reserva a ADMIN. La seguridad efectiva se aplica en Spring Security.
3. **¿Por qué se identifica la orden por `orderNumber`?** Ese es el identificador del contrato de integración y de las rutas; el `id` de base no es el número externo de la orden.
4. **¿Qué implica el 302 de SAP?** Es la convención del backend para una orden existente. No representa un alta nueva. El cliente lanza `ApiError` y la UI muestra el mensaje recibido.
5. **¿De dónde sale el PIN?** Lo genera el backend al registrar la tara y solo se entrega en esa respuesta. La activación envía el número de orden y el PIN como números; un PIN incorrecto devuelve 403 sin cerrar la sesión.
6. **¿Por qué HTTP 200 no garantiza que una lectura esté guardada?** El contrato responde `{ saved, reason }`. Una densidad inválida, por ejemplo, produce `saved: false`; no actualiza cabecera, histórico ni progreso confirmado.
7. **¿Cómo se evita repetir masa con polling atrasado?** Se toma el máximo entre la última masa del servidor y la última aceptada localmente. Los envíos se serializan y los descartes no se cuentan como progreso.
8. **¿Cómo se relacionan el caudal y el bombeo automático?** Se convierte kg/h a kg por intervalo: 12.000 × 1.500 / 3.600.000 = 5 kg. El siguiente intervalo comienza después de la respuesta; los botones manuales son aceleradores de demostración.
9. **¿Quién crea la alarma y envía el correo?** Spring Boot evalúa la lectura válida, crea una pendiente por orden y envía el correo después del commit. El frontend consulta el banner y `emailSentAt`; no manda correos ni decide si debe reenviarlos.
10. **¿Por qué no convertir la fecha prevista con `toISOString()`?** El contrato recibe hora de Argentina sin offset. `toISOString()` expresaría UTC y desplazaría la hora ingresada. El formulario conserva el valor local explícitamente rotulado como hora de Argentina.
11. **¿Qué sucede al cerrar?** La orden pasa de 2 a 3 y deja de aceptar lecturas. El pesaje final posterior la pasa de 3 a 4 y devuelve la conciliación. No se fuerza un cambio de estado en memoria para aparentar éxito.
12. **¿Cómo se comprueba la conciliación?** Con tara 14.500 kg, bruto 16.000 kg y masa acumulada 1.500 kg: neto = 1.500 kg y diferencia = 0 kg. Los promedios vienen de las lecturas guardadas; sin lecturas, son nulos y se muestran como «Sin datos».
