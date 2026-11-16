# Verificación independiente de `main` (13/11/2026)

**Qué es:** después de que el PR #7 integró las Fases 7, 8 y 9 y el rediseño AetherLoad, se volvió a comprobar `main` por separado de lo que declaran los informes de esas fases. **Commit verificado:** `5ef94ea` (merge del PR #7). **Quién:** Martín González, con asistencia de Claude Code.

## 1. Resultado

| Comprobación | Resultado |
|---|---|
| `npx tsc --noEmit` | sin errores |
| `npm run lint` | 0 errores y 0 advertencias |
| `npm test` | 162 tests, 0 fallas |
| `npm run build` | compila; 10 rutas |
| CI de `main` (GitHub Actions) | en verde |
| Sitio desplegado en la VM | `/login`, `/orders`, `/alarms` y `/simulator` responden 200 |
| Mock y tipos heredados | no quedan (`src/services/mock` no existe; 0 usos de `any`) |
| **Chrome real contra el backend real (Spring Boot + MySQL locales)** | **110 verificaciones, 0 fallas** |

Las órdenes y alarmas de la prueba las creó la **API de integración real** (SAP, balanza y sistema de carga); no hay datos simulados en el navegador, salvo el corte de red del escenario 6 (se aborta la conexión a propósito).

## 2. Qué cubre la prueba con Chrome

1. **Autenticación y roles (31):** las 6 rutas protegidas redirigen a `/login`; formulario vacío; contraseña incorrecta con el mensaje real y sin token; un token con firma falsa recibe 401 y se cierra la sesión; los 6 usuarios (admin, supervisor, operador, sap, tms, loader) ven el rol, el menú, los botones y las pantallas que les corresponden, y **ninguno dispara pedidos que el backend rechace** (0 respuestas 401, 403 o 5xx en la navegación normal).
2. **Órdenes (30):** conteos por estado y alarmas pendientes del tablero iguales a la API; filtro por los 4 estados y 5 órdenes distintas iguales a `GET /orders`; ETA igual al cálculo manual; tiempo transcurrido en vivo, igual a *ahora − `loadingStartDateTime`* en hora de Argentina (±3 s) y solo en estado 2; una lectura nueva aparece sola en menos de 8 s; el cierre externo se refleja sin recargar; 404 con el mensaje real; **cierre desde la interfaz** como `operador` (confirmación, cancelar no cierra, el historial registra al actor).
3. **Conciliación (13):** dos órdenes en estado 4 (diferencia 0 y diferencia de 200 kg con 11,76 %): tara, final, neto, producto cargado, diferencia y porcentaje en pantalla coinciden con la API y con el cálculo (`neto = final − tara`, `diferencia = neto − cargado`); la de 200 kg se marca fuera de tolerancia y la de 0 no; una orden en estado 3 no tiene conciliación y se explica con el 409 del backend.
4. **Alarmas (18):** una lectura sobre el umbral crea una alarma pendiente y otra más **no** crea una segunda (D-3); el operador la ve pero no puede aceptarla (sin botón y el backend le responde 403); el supervisor la acepta desde la interfaz con una observación y el backend registra *ACKNOWLEDGED*, el usuario **del token**, la fecha y la observación; el cuerpo enviado lleva solo `observation` (D-5); aceptar dos veces da 409; tras aceptar, una nueva superación vuelve a alarmar; el supervisor ve la configuración en solo lectura y el admin la modifica (umbral y destinatario) y se restaura la original.
5. **Simulador (13):** desde la interfaz se recorre el circuito: SAP (201, fecha prevista guardada como 08:30 de Argentina), tara (estado 2, PIN de 5 dígitos visible solo ahí y ausente del `GET` de la orden), PIN incorrecto (403 con mensaje y la sesión sigue), PIN correcto (200), bombeo «+500 kg» (el backend guarda 500 kg), «Cerrar carga» con confirmación (estado 3), pesaje final menor que la tara (400 visible, sigue en 3) y pesaje final correcto (estado 4 con conciliación neto 1500 / cargado 500).
6. **Tiempo real (5):** con la pestaña oculta no se hacen pedidos (3 en 6,5 s visible, 0 oculta) y al volver se pide enseguida; con la red cortada aparece el aviso con el mensaje real y se conserva el dato; al volver la conexión, el aviso desaparece solo.

## 3. Lo que NO se verificó

- **Correo real:** no se probó una cuenta SMTP real ni la entrega a una casilla externa. En el entorno local las alarmas figuran como «Correo no enviado» porque no hay servidor SMTP configurado; es lo esperado. La Fase 9 declara una prueba con un capturador SMTP local, que **no se repitió** acá.
- **La VM:** solo se comprobó que las páginas respondan 200; no se hizo el recorrido completo contra el backend desplegado, que además necesita la clave JWT, el CORS y los usuarios por rol configurados en la VM.
- **Aspecto visual:** no se evaluó el diseño (contraste, vista móvil de 390 px, impresión del remito); lo declara la documentación del rediseño y no se repitió.
- **Otros navegadores:** solo Chrome.

## 4. Observaciones

- Al escribir la prueba aparecieron cinco «fallas», **todas del guion y no de la aplicación**: confirmaciones con textos distintos a los que esperaba (el diálogo de cerrar orden dice «Sí, cerrar la orden»; el del simulador es una confirmación en línea con «Confirmar cierre»), un selector que no encontraba botones sin el atributo `type` escrito y una extracción de PIN que tomaba un número de orden. Se aislaron y se comprobó cada caso por separado antes de corregir el guion.
- Los datos de prueba quedaron en la base de desarrollo local (no en la de producción). La configuración de alarmas se restauró al terminar.
- El guion de la prueba no forma parte del repositorio.
