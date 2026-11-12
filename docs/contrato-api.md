# Contrato de la API — IW3 Terminal de gas licuado

**Congelado el 12/11/2026 (examen final, Fase 3 del backend).** Fuente de verdad para el frontend. Generado desde el `/v3/api-docs` del backend en marcha y con
respuestas reales (los ejemplos son datos verdaderos de la base de desarrollo); el generador comprueba que **todas** las rutas publicadas figuran acá y viceversa
(17 operaciones). Si el backend cambia, este documento se regenera y se avisa. Swagger interactivo: `/swagger-ui.html`.

## 1. Convenciones

| Tema | Regla |
|---|---|
| Base | `{NEXT_PUBLIC_API_URL}` = `http://localhost:8080/api/v1` en local. Las rutas de abajo llevan el prefijo completo |
| Formato | JSON (`Content-Type: application/json`). El login recibe **formulario** (`application/x-www-form-urlencoded`) y devuelve el token en **texto plano** |
| Fechas | `LocalDateTime` ISO **sin zona** (`2026-11-12T10:30:00`), hora de **Argentina**. El frontend debe interpretarlas como hora de Argentina, no como la del navegador |
| Estado de la orden | **Número** (`"status": 2`): 1 Pendiente de pesaje inicial · 2 Con pesaje inicial registrado (llegan lecturas) · 3 Cerrada para carga · 4 Finalizada. Secuencial y sin retroceso |
| Identidad de la orden | Se identifica por **`orderNumber`** (no por `id`) en todas las rutas |
| Números | Masa y pesos en kg, caudal en kg/h, temperatura en °C, densidad entre 0 y 1 (sin incluirlos). No se redondean |
| Paginación | `page` (desde 0) y `size` (20 por defecto, **máximo 100**). La respuesta es `{ content, page: { size, number, totalElements, totalPages } }` |
| Orden y filtros | Solo en `GET /orders` (ver 4.2). El resto tiene orden fijo y **ignora** `sort` |

### Autenticación

1. `POST /api/v1/login` con `username` y `password` → token JWT (HS512, **vence a la 1 hora**).
2. Enviarlo en cada pedido: `Authorization: Bearer <token>`. La API **no acepta** HTTP Basic.
3. El token trae `sub` (usuario), `roles`, `email`, `version` y `exp` (segundos Unix). Claims reales del admin de desarrollo:

```json
{
  "sub": "admin",
  "roles": [
    "ROLE_ADMIN"
  ],
  "email": "admin@iw3.local",
  "version": "1.0.0",
  "exp": 1794507872
}
```

No hay *refresh* ni *logout* en el servidor: al vencer, hay que volver a iniciar sesión. El frontend puede leer `exp` y `roles` decodificando el payload (no está cifrado, solo firmado).

### Errores (formato estándar)

Todos los errores llevan el mismo JSON: `{ "message": ..., "code": <http>, "devInfo": ... }`. **El frontend muestra solo `message`.** `devInfo` trae el *stack trace* en desarrollo y es `null` en producción: no se muestra nunca.

| Código | Cuándo | `message` de ejemplo |
|---|---|---|
| 400 | Datos ausentes o inválidos | `sort inválido: [truck.plate]. Campos permitidos: [...]` |
| 401 | Falta el token, es inválido o **venció**; o usuario/contraseña incorrectos en el login | `Falta el token o es inválido` |
| 403 | El rol del usuario no permite el endpoint (o la contraseña de activación es incorrecta, en la activación de carga) | `No tiene permisos para realizar esta operación` |
| 404 | La orden o la alarma no existen | `No se encuentra la Orden numero=1` |
| 409 | El estado actual no permite la operación (por ejemplo, la conciliación de una orden que no está en estado 4) | ... |
| 302 | Convención de la cátedra: alta de una orden con un `orderNumber` que ya existe (`POST /integration/sap/orders`) | ... |
| 500 | Error interno | |

Reacción recomendada del frontend: **401 → cerrar sesión y volver al login**; **403 → mostrar «sin permisos» sin cerrar la sesión**; 404, 409 y 400 → mostrar `message`.

El 401 **no** lleva el header `WWW-Authenticate` (con él, el navegador abriría su diálogo nativo de usuario y contraseña al vencer el token).

### CORS

Los navegadores pueden llamar a la API desde otro origen. El preflight (`OPTIONS`) se responde **sin token** con `Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS`, `Access-Control-Allow-Headers: authorization, content-type` y `Access-Control-Max-Age: 3600`.
Los errores (incluido el 401) también llevan las cabeceras CORS, y se expone el header `Location` (alta de órdenes). Los orígenes permitidos se definen con la variable de entorno `CORS_ALLOWED_ORIGINS` (lista separada por coma); sin definirla, la API acepta cualquier origen.
Verificado con un navegador real (Chrome): desde el origen permitido funcionan el login, los `GET` con `Authorization`, la lectura del 401 y los `PUT` con JSON; desde otro origen el navegador los bloquea.

## 2. Roles

`ROLE_ADMIN` accede a todo. Personas: `ROLE_SUPERVISOR`, `ROLE_OPERADOR`. Sistemas externos: `ROLE_SAP`, `ROLE_TMS`, `ROLE_LOADER`. Los roles viajan en el claim `roles` del token. La matriz por endpoint está en la columna «Roles» de la sección 3.
La interfaz debe ocultar lo que el rol no permite, pero **la API siempre decide** (responde 403).

## 3. Endpoints

| Método y ruta | Roles | Qué hace | Respuestas |
|---|---|---|---|
| `GET /alarms` | ADMIN, SUPERVISOR, OPERADOR | Lista las alarmas paginadas, de la más reciente a la más antigua | 200, 400, 401, 403, 500 |
| `GET /alarms/config` | ADMIN, SUPERVISOR | Obtiene la configuración de la alarma | 200, 401, 403, 500 |
| `PUT /alarms/config` | ADMIN | Configura el umbral y los correos de destino | 200, 400, 401, 403, 500 |
| `POST /alarms/{id}/acknowledge` | ADMIN, SUPERVISOR | Acepta una alarma pendiente | 200, 400, 401, 403, 404, 409, 500 |
| `POST /integration/loader/activation` | ADMIN, LOADER | Activa la carga de una orden | 200, 400, 401, 403, 404, 409, 500 |
| `POST /integration/loader/orders/{orderNumber}/close` | ADMIN, SUPERVISOR, OPERADOR, LOADER | Cierra la orden para carga | 200, 401, 403, 404, 409, 500 |
| `POST /integration/loader/orders/{orderNumber}/details` | ADMIN, LOADER | Registra una lectura del caudalímetro | 200, 400, 401, 403, 404, 409, 500 |
| `POST /integration/sap/orders` | ADMIN, SAP | Recibe una orden de carga | 201, 302, 400, 401, 403, 500 |
| `POST /integration/tms/orders/{orderNumber}/final-weight` | ADMIN, TMS | Registra el pesaje final y devuelve la conciliación | 200, 400, 401, 403, 404, 409, 500 |
| `POST /integration/tms/orders/{orderNumber}/tare` | ADMIN, TMS | Registra la tara (pesaje inicial) | 200, 400, 401, 403, 404, 409, 500 |
| `POST /login` | público | Inicia sesión y devuelve el token JWT | 200, 401, 500 |
| `GET /orders` | ADMIN, SUPERVISOR, OPERADOR | Lista las órdenes paginadas, con filtro por estado y orden elegible | 200, 400, 401, 403, 500 |
| `GET /orders/{orderNumber}` | ADMIN, SUPERVISOR, OPERADOR | Obtiene una orden por su número | 200, 401, 403, 404, 500 |
| `GET /orders/{orderNumber}/details` | ADMIN, SUPERVISOR, OPERADOR | Lista paginada de las lecturas guardadas de una orden (histórico del caudalímetro) | 200, 401, 403, 404, 500 |
| `GET /orders/{orderNumber}/reconciliation` | ADMIN, SUPERVISOR, OPERADOR | Conciliación de una orden finalizada | 200, 401, 403, 404, 409, 500 |
| `GET /orders/{orderNumber}/status-log` | ADMIN, SUPERVISOR, OPERADOR | Historial de cambios de estado de una orden | 200, 401, 403, 404, 500 |
| `GET /demo/encodepass` | ADMIN | Codifica una contraseña con BCrypt (demo de la cátedra) | 200, 401, 403, 500 |

### 3.1 Detalle de cada endpoint

Los parámetros de ruta `{orderNumber}` son enteros. Las rutas se escriben sin el prefijo `/api/v1` (salvo `/demo`).

#### `GET /alarms`

**Lista las alarmas paginadas, de la más reciente a la más antigua.** Filtros opcionales: status (PENDING o ACKNOWLEDGED) y orderNumber. También page (desde 0) y size (por defecto 20, máximo 100). El orden es fijo por fecha de disparo descendente.

| Parámetro | Tipo | Descripción |
|---|---|---|
| `status` | string |  (opcional) |
| `orderNumber` | integer |  (opcional) |
| `page` | integer | Zero-based page index (0..N) (opcional) |
| `size` | integer | The size of the page to be returned (opcional) |
| `sort` | array | Sorting criteria in the format: property,(asc|desc). Default sort order is ascending. Multiple sort criteria are supported. (opcional) |

Roles: **ADMIN, SUPERVISOR, OPERADOR** · Respuestas: `200` Página de alarmas (content + page); `400` status inválido; `401` Falta el token o es inválido; `403` El rol del usuario no permite este endpoint; `500` Error interno

#### `GET /alarms/config`

**Obtiene la configuración de la alarma.** Umbral de temperatura (°C) y correos de destino. Si nadie la configuró, rige el umbral por defecto y no hay destinatarios.

Roles: **ADMIN, SUPERVISOR** · Respuestas: `200` La configuración vigente; `401` Falta el token o es inválido; `403` El rol del usuario no permite este endpoint; `500` Error interno

#### `PUT /alarms/config`

**Configura el umbral y los correos de destino.** Reemplaza la configuración. temperatureThreshold es obligatorio y finito; recipientEmails es obligatorio (puede ser una lista vacía), sin repetidos, con formato de correo válido y como máximo 20.

Roles: **ADMIN** · Respuestas: `200` La configuración guardada; `400` Datos ausentes o inválidos; `401` Falta el token o es inválido; `403` El rol del usuario no permite este endpoint; `500` Error interno

#### `POST /alarms/{id}/acknowledge`

**Acepta una alarma pendiente.** Solo la puede aceptar un usuario autorizado (ADMIN o SUPERVISOR). Queda registrado quién (sale del token), cuándo y la observación opcional. Una vez aceptada, una nueva superación del umbral en esa orden vuelve a alarmar.

| Parámetro | Tipo | Descripción |
|---|---|---|
| `id` | integer |  (obligatorio) |

Roles: **ADMIN, SUPERVISOR** · Respuestas: `200` La alarma aceptada; `400` Observación demasiado larga; `401` Falta el token o es inválido; `403` El rol del usuario no permite este endpoint; `404` La alarma no existe; `409` La alarma ya fue aceptada; `500` Error interno

#### `POST /integration/loader/activation`

**Activa la carga de una orden.** Comprueba que la orden exista, esté en estado 2 y que la contraseña de activación sea correcta. Devuelve el preset (kg a cargar) y registra activationDateTime la primera vez. Es idempotente: activar otra vez con la contraseña correcta devuelve el mismo preset. No cambia el estado.

Roles: **ADMIN, LOADER** · Respuestas: `200` Carga activada; devuelve el preset; `400` Falta orderNumber o password; `401` Falta el token o es inválido; `403` El rol del usuario no permite este endpoint; `404` La orden no existe; `409` La orden no está en estado 2; `500` Error interno

#### `POST /integration/loader/orders/{orderNumber}/close`

**Cierra la orden para carga.** Punto 4: pasa la orden del estado 2 al 3 (Cerrada para carga). Desde ese momento se rechazan nuevas lecturas del caudalímetro (409). Registra el cambio en el historial de estados con el usuario del token. No lleva cuerpo. No es idempotente: cerrar otra vez responde 409.

| Parámetro | Tipo | Descripción |
|---|---|---|
| `orderNumber` | integer |  (obligatorio) |

Roles: **ADMIN, SUPERVISOR, OPERADOR, LOADER** · Respuestas: `200` Orden cerrada; devuelve la orden en estado 3; `401` Falta el token o es inválido; `403` El rol del usuario no permite este endpoint; `404` La orden no existe; `409` La orden no está en estado 2 (por ejemplo, ya está cerrada); `500` Error interno

#### `POST /integration/loader/orders/{orderNumber}/details`

**Registra una lectura del caudalímetro.** Recibe los datos en tiempo real del caudalímetro mientras la orden está en estado 2 y activada. Si la lectura es válida, la guarda en el histórico y actualiza la cabecera (últimos valores, inicio y fin de carga) con la hora de recepción del servidor. Si es inválida, la descarta sin guardarla y devuelve el motivo.

| Parámetro | Tipo | Descripción |
|---|---|---|
| `orderNumber` | integer |  (obligatorio) |

Roles: **ADMIN, LOADER** · Respuestas: `200` Lectura procesada (guardada o descartada); `400` Faltan campos obligatorios o formato inválido; `401` Falta el token o es inválido; `403` El rol del usuario no permite este endpoint; `404` La orden no existe; `409` La orden no está en estado 2 o no está activada; `500` Error interno

#### `POST /integration/sap/orders`

**Recibe una orden de carga.** Sincroniza camión, chofer, cliente y producto por código externo y crea la orden en estado 1 (pendiente de pesaje inicial). El estado y la fecha de recepción los asigna el backend.

Roles: **ADMIN, SAP** · Respuestas: `201` Orden creada; el header location apunta a la orden; `302` Ya existe una orden con ese número (convención de la cátedra); `400` Datos obligatorios ausentes o fuera de rango; `401` Falta el token o es inválido; `403` El rol del usuario no permite este endpoint; `500` Error interno

#### `POST /integration/tms/orders/{orderNumber}/final-weight`

**Registra el pesaje final y devuelve la conciliación.** Punto 5: guarda el peso del camión cargado y la hora de recepción, pasa la orden del estado 3 al 4, registra el cambio en el historial y devuelve la conciliación. Solo para órdenes cerradas (estado 3). El peso debe ser mayor que 0, finito y no menor que la tara. No es idempotente.

| Parámetro | Tipo | Descripción |
|---|---|---|
| `orderNumber` | integer |  (obligatorio) |

Roles: **ADMIN, TMS** · Respuestas: `200` Pesaje registrado; devuelve la conciliación; `400` Peso inválido (≤ 0, infinito o menor que la tara); `401` Falta el token o es inválido; `403` El rol del usuario no permite este endpoint; `404` La orden no existe; `409` La orden no está en estado 3 (o no tiene tara); `500` Error interno

#### `POST /integration/tms/orders/{orderNumber}/tare`

**Registra la tara (pesaje inicial).** Guarda el peso del camión vacío y la fecha del pesaje, genera la contraseña de activación de 5 dígitos y pasa la orden del estado 1 al 2. Solo para órdenes pendientes de pesaje inicial.

| Parámetro | Tipo | Descripción |
|---|---|---|
| `orderNumber` | integer |  (obligatorio) |

Roles: **ADMIN, TMS** · Respuestas: `200` Tara registrada; devuelve la contraseña de activación; `400` Tara inválida (debe ser mayor que 0); `401` Falta el token o es inválido; `403` El rol del usuario no permite este endpoint; `404` La orden no existe; `409` La orden no está pendiente de pesaje inicial; `500` Error interno

#### `POST /login`

**Inicia sesión y devuelve el token JWT.** Recibe username y password como parámetros y devuelve el token (texto) que hay que enviar como Authorization: Bearer TOKEN en los demás endpoints. El token dura 1 hora. Es el único endpoint público de la API.

| Parámetro | Tipo | Descripción |
|---|---|---|
| `username` | string |  (obligatorio) |
| `password` | string |  (obligatorio) |

Roles: **público** · Respuestas: `200` Token JWT (texto); `401` Usuario o contraseña incorrectos; `500` Error interno

#### `GET /orders`

**Lista las órdenes paginadas, con filtro por estado y orden elegible.** Parámetros opcionales: status (1 a 4), page (desde 0, por defecto 0), size (por defecto 20, máximo 100) y sort con el formato campo,dirección (por ejemplo sort=plannedLoadDateTime,desc). Campos permitidos: orderNumber, plannedLoadDateTime, receptionDateTime, status y preset. Sin sort: número de orden descendente (la más reciente primero). Si se ordena por otro campo, el número de orden descendente desempata para que la paginación sea estable.

| Parámetro | Tipo | Descripción |
|---|---|---|
| `status` | string | Filtra por estado de la orden (1 a 4) (opcional) |
| `page` | integer | Zero-based page index (0..N) (opcional) |
| `size` | integer | The size of the page to be returned (opcional) |
| `sort` | array | Sorting criteria in the format: property,(asc|desc). Default sort order is ascending. Multiple sort criteria are supported. (opcional) |

Roles: **ADMIN, SUPERVISOR, OPERADOR** · Respuestas: `200` Página de órdenes (content + page); `400` status fuera de 1 a 4 o sort por un campo no permitido; `401` Falta el token o es inválido; `403` El rol del usuario no permite este endpoint; `500` Error interno

#### `GET /orders/{orderNumber}`

**Obtiene una orden por su número.** 

| Parámetro | Tipo | Descripción |
|---|---|---|
| `orderNumber` | integer |  (obligatorio) |

Roles: **ADMIN, SUPERVISOR, OPERADOR** · Respuestas: `200` La orden; `401` Falta el token o es inválido; `403` El rol del usuario no permite este endpoint; `404` La orden no existe; `500` Error interno

#### `GET /orders/{orderNumber}/details`

**Lista paginada de las lecturas guardadas de una orden (histórico del caudalímetro).** Parámetros opcionales: page (desde 0, por defecto 0) y size (por defecto 20, máximo 100). El orden es fijo por id ascendente (de la lectura más antigua a la más reciente).

| Parámetro | Tipo | Descripción |
|---|---|---|
| `orderNumber` | integer |  (obligatorio) |
| `page` | integer | Zero-based page index (0..N) (opcional) |
| `size` | integer | The size of the page to be returned (opcional) |
| `sort` | array | Sorting criteria in the format: property,(asc|desc). Default sort order is ascending. Multiple sort criteria are supported. (opcional) |

Roles: **ADMIN, SUPERVISOR, OPERADOR** · Respuestas: `200` Página de lecturas (content + page); `401` Falta el token o es inválido; `403` El rol del usuario no permite este endpoint; `404` La orden no existe; `500` Error interno

#### `GET /orders/{orderNumber}/reconciliation`

**Conciliación de una orden finalizada.** Punto 5: pesaje inicial y final, producto cargado, neto por balanza, diferencia con el caudalímetro y promedios de temperatura, densidad y caudal de las lecturas guardadas. Se calcula en cada consulta (no se guarda) y solo está disponible para órdenes en estado 4.

| Parámetro | Tipo | Descripción |
|---|---|---|
| `orderNumber` | integer |  (obligatorio) |

Roles: **ADMIN, SUPERVISOR, OPERADOR** · Respuestas: `200` Conciliación de la orden; `401` Falta el token o es inválido; `403` El rol del usuario no permite este endpoint; `404` La orden no existe; `409` La orden no está en estado 4; `500` Error interno

#### `GET /orders/{orderNumber}/status-log`

**Historial de cambios de estado de una orden.** 

| Parámetro | Tipo | Descripción |
|---|---|---|
| `orderNumber` | integer |  (obligatorio) |

Roles: **ADMIN, SUPERVISOR, OPERADOR** · Respuestas: `200` Historial de la orden, del más antiguo al más reciente; `401` Falta el token o es inválido; `403` El rol del usuario no permite este endpoint; `404` La orden no existe; `500` Error interno

#### `GET /demo/encodepass`

**Codifica una contraseña con BCrypt (demo de la cátedra).** Devuelve el hash BCrypt de la contraseña recibida. Sirve para generar el hash que se guarda en la tabla users. Exige token.

| Parámetro | Tipo | Descripción |
|---|---|---|
| `password` | string |  (obligatorio) |

Roles: **ADMIN** · Respuestas: `200` Hash BCrypt (texto); `401` Falta el token o es inválido; `403` El rol del usuario no permite este endpoint; `500` Error interno

## 4. Ejemplos reales

### 4.1 Orden (`GET /orders/{orderNumber}`) — en carga, estado 2

`activationPassword` **no** se publica (solo se entrega en la respuesta de la tara). `tare`, `loadingStartDateTime`, las `last*` y `finalWeight*` son nulos hasta que ocurre el evento.

```json
{
  "id": 195,
  "orderNumber": 1794504006,
  "truck": {
    "id": 26,
    "externalCode": "ALM-TRK",
    "plate": "AL123RM",
    "description": null,
    "tanks": [
      {
        "id": 39,
        "number": 1,
        "capacityLiters": 10000.0
      }
    ]
  },
  "driver": {
    "id": 25,
    "externalCode": "ALM-DRV",
    "name": "Ana",
    "lastName": "Prueba",
    "document": null
  },
  "customer": {
    "id": 24,
    "externalCode": "ALM-CUS",
    "companyName": "Gas de Prueba SA",
    "contact": null
  },
  "product": {
    "id": 15,
    "externalCode": "ALM-PRD",
    "name": "GLP",
    "description": null
  },
  "plannedLoadDateTime": "2026-12-01T08:00:00",
  "preset": 15000.0,
  "status": 2,
  "receptionDateTime": "2026-11-12T14:20:06.801704",
  "tare": 14500.0,
  "initialWeighingDateTime": "2026-11-12T14:20:06.929927",
  "activationDateTime": "2026-11-12T14:20:07.054442",
  "loadingStartDateTime": "2026-11-12T14:20:07.174519",
  "loadingEndDateTime": "2026-11-12T14:20:08.396331",
  "lastAccumulatedMass": 400.0,
  "lastDensity": 0.5,
  "lastTemperature": 31.0,
  "lastFlowRate": 3000.0,
  "finalWeight": null,
  "finalWeighingDateTime": null
}
```

### 4.2 Listado con filtro y orden — `GET /orders?status=2&sort=plannedLoadDateTime,desc&size=2`

`status` (1 a 4) filtra por estado. `sort=campo,dirección` ordena (dirección `asc` o `desc`); campos permitidos: `orderNumber`, `plannedLoadDateTime`, `receptionDateTime`, `status` y `preset`;
cualquier otro da 400. Sin `sort`: número de orden descendente (la más reciente primero). Si se ordena por otro campo, el número de orden descendente desempata para que la paginación sea estable.
`totalElements` y `totalPages` reflejan el filtro. Ejemplo (se muestran las 2 órdenes, abreviadas a sus campos principales):

```json
{
  "content": [
    {
      "orderNumber": 1794504006,
      "status": 2,
      "plannedLoadDateTime": "2026-12-01T08:00:00",
      "preset": 15000.0,
      "lastAccumulatedMass": 400.0,
      "lastTemperature": 31.0,
      "lastFlowRate": 3000.0
    },
    {
      "orderNumber": 1794499811,
      "status": 2,
      "plannedLoadDateTime": "2026-12-01T08:00:00",
      "preset": 15000.0,
      "lastAccumulatedMass": 400.0,
      "lastTemperature": 31.0,
      "lastFlowRate": 3000.0
    }
  ],
  "page": {
    "size": 2,
    "number": 0,
    "totalElements": 80,
    "totalPages": 40
  }
}
```

### 4.3 Lecturas guardadas — `GET /orders/{orderNumber}/details?size=2`

```json
{
  "content": [
    {
      "id": 339,
      "accumulatedMass": 100.0,
      "density": 0.5,
      "temperature": 20.0,
      "flowRate": 3000.0,
      "timestamp": "2026-11-12T14:20:07.174519"
    },
    {
      "id": 340,
      "accumulatedMass": 200.0,
      "density": 0.5,
      "temperature": 26.0,
      "flowRate": 3000.0,
      "timestamp": "2026-11-12T14:20:07.409915"
    }
  ],
  "page": {
    "size": 2,
    "number": 0,
    "totalElements": 4,
    "totalPages": 2
  }
}
```

### 4.4 Historial de estados — `GET /orders/{orderNumber}/status-log`

```json
[
  {
    "id": 232,
    "fromStatus": null,
    "toStatus": 1,
    "dateTime": "2026-11-02T17:47:24.947429",
    "actor": "admin",
    "observations": "Orden recibida desde el sistema externo"
  },
  {
    "id": 233,
    "fromStatus": 1,
    "toStatus": 2,
    "dateTime": "2026-11-02T17:47:25.786172",
    "actor": "admin",
    "observations": "Tara registrada: 14500.5 kg"
  },
  {
    "id": 234,
    "fromStatus": 2,
    "toStatus": 3,
    "dateTime": "2026-11-02T17:47:26.944369",
    "actor": "admin",
    "observations": "Orden cerrada para carga"
  },
  {
    "id": 235,
    "fromStatus": 3,
    "toStatus": 4,
    "dateTime": "2026-11-02T17:47:27.179272",
    "actor": "admin",
    "observations": "Pesaje final registrado"
  }
]
```

### 4.5 Conciliación — `GET /orders/{orderNumber}/reconciliation` (solo estado 4; otro estado → 409)

`loadedProduct` es la última masa acumulada; `scaleNet = finalWeight - tare`; `difference = scaleNet - loadedProduct`. Con cero lecturas `loadedProduct` es 0.0 y los promedios `null`. El **porcentaje** no viene: el frontend lo calcula como `difference / scaleNet * 100`.

```json
{
  "orderNumber": 652444947,
  "tare": 14500.5,
  "finalWeight": 19310.35,
  "loadedProduct": 4800.1,
  "scaleNet": 4809.8499999999985,
  "difference": 9.749999999998181,
  "averageTemperature": 19.15,
  "averageDensity": 0.51875,
  "averageFlowRate": 3532.675
}
```

### 4.6 Alarmas — `GET /alarms?status=PENDING&orderNumber=&page=&size=`

`status` es `PENDING` o `ACKNOWLEDGED`. `emailSentAt` nulo significa que el correo **no salió** (todavía, o porque el servidor de correo falló; no se reintenta): la interfaz debe mostrarlo.
Aceptar: `POST /alarms/{id}/acknowledge` con cuerpo opcional `{ "observation": "..." }` (máx. 500 caracteres); el usuario sale del token.

```json
{
  "content": [
    {
      "id": 13,
      "orderNumber": 1794504006,
      "temperature": 31.0,
      "threshold": 25.0,
      "status": "PENDING",
      "triggeredAt": "2026-11-12T14:20:08.410944",
      "emailSentAt": null,
      "acknowledgedBy": null,
      "acknowledgedAt": null,
      "observation": null
    }
  ],
  "page": {
    "size": 1,
    "number": 0,
    "totalElements": 13,
    "totalPages": 13
  }
}
```

### 4.7 Configuración de la alarma — `GET` y `PUT /alarms/config`

`PUT` reemplaza todo: hay que enviar siempre `temperatureThreshold` (número finito) y `recipientEmails` (lista, puede ser vacía; hasta 20, sin repetidos, con formato de correo válido).

```json
{
  "recipientEmails": [],
  "temperatureThreshold": 30.0
}
```

### 4.8 Errores reales

401 (sin token):

```json
{
  "message": "Falta el token o es inválido",
  "code": 401,
  "devInfo": null
}
```

401 (login con contraseña incorrecta):

```json
{
  "message": "Invalid password",
  "code": 401,
  "devInfo": null
}
```

403 (un operador intenta crear una orden):

```json
{
  "message": "No tiene permisos para realizar esta operación",
  "code": 403,
  "devInfo": null
}
```

404:

```json
{
  "message": "No se encuentra la Orden numero=1",
  "code": 404,
  "devInfo": null
}
```

409 (conciliación de una orden que no está finalizada):

```json
{
  "message": "La conciliación solo está disponible para órdenes en estado 4 (orden 1794504009 en estado 1)",
  "code": 409,
  "devInfo": null
}
```

400 (orden por un campo no permitido):

```json
{
  "message": "sort inválido: [truck.plate]. Campos permitidos: [orderNumber, plannedLoadDateTime, preset, receptionDateTime, status]",
  "code": 400,
  "devInfo": null
}
```

## 5. Cuerpos de los pedidos de integración

Los usan los sistemas externos y el **simulador** del frontend (rol `ADMIN`). Todos requieren el rol de la sección 3.

| Endpoint | Cuerpo | Respuesta 200 |
|---|---|---|
| `POST /integration/sap/orders` (Punto 1) | Orden con camión, chofer, cliente y producto por **código externo** (ejemplo abajo) | **201** sin cuerpo y header `Location: /api/v1/orders/{orderNumber}`; **302** si el número ya existe |
| `POST /integration/tms/orders/{n}/tare` (Punto 2) | `{ "weight": 14500.0 }` | `{ "activationPassword": 48213 }` (único lugar donde aparece la contraseña) |
| `POST /integration/loader/activation` (Punto 3) | `{ "orderNumber": 90001, "password": 48213 }` | `{ "preset": 15000.0 }`; 403 si la contraseña es incorrecta; idempotente |
| `POST /integration/loader/orders/{n}/details` (Punto 3) | `{ "accumulatedMass": 1250.5, "density": 0.52, "temperature": 18.4, "flowRate": 3600.0 }` | **Siempre 200** `{ "saved": true, "reason": null }` o `{ "saved": false, "reason": "..." }` (lectura descartada) |
| `POST /integration/loader/orders/{n}/close` (Punto 4) | sin cuerpo | La orden con `"status": 3` |
| `POST /integration/tms/orders/{n}/final-weight` (Punto 5) | `{ "weight": 16490.0 }` | La conciliación (igual que el `GET`) |

Una lectura se **descarta** si el caudal es ≤ 0, la masa es ≤ 0 o menor que la última válida, o la densidad no está entre 0 y 1. Una lectura **válida** con temperatura mayor al umbral crea una alarma (una pendiente por orden) y manda un correo.

Cuerpo de `POST /integration/sap/orders`:

```json
{ "orderNumber": 90001, "plannedLoadDateTime": "2026-12-01T08:00:00", "preset": 15000,
  "truck": { "externalCode": "TRK-001", "plate": "AB123CD",
             "tanks": [ { "number": 1, "capacityLiters": 10000 }, { "number": 2, "capacityLiters": 5000 } ] },
  "driver": { "externalCode": "DRV-001", "name": "Juan", "lastName": "Perez", "document": "30111222" },
  "customer": { "externalCode": "CUS-001", "companyName": "Gas del Sur SA", "contact": "contacto@gas.example" },
  "product": { "externalCode": "PRD-GLP", "name": "GLP", "description": "Gas licuado de petróleo" } }
```

`preset` es obligatorio (si falta, 400 con el formato de Spring: sin `message`). Las cuatro entidades se sincronizan por `externalCode`.

## 6. Qué cambió desde el contrato anterior (parcial → final)

| Fase | Cambio |
|---|---|
| 1 | Roles: cada endpoint exige uno (403 con JSON estándar). El token ya traía `roles` |
| 2 | Alarmas: 4 endpoints nuevos y 3 tablas; la respuesta de las lecturas **no cambia** |
| 3 | `GET /orders` suma `status` y `sort`; el 401 ya no lleva `WWW-Authenticate` y es JSON estándar; HTTP Basic deja de funcionar; CORS responde el preflight sin token y es configurable; la clave JWT y los orígenes CORS salen de variables de entorno |

## 7. Pendiente / fuera del contrato

- No hay `refresh token`, `logout` ni administración de usuarios por API (los usuarios se crean por SQL).
- No hay WebSockets ni SSE: el «tiempo real» es *polling* (recomendado 2 a 5 s).
- Las alarmas no se reintentan si falla el correo.
- El contrato **no** incluye `GET /alarms/{id}` ni búsqueda de texto en el listado de órdenes.
