# Liquid Gas Monitoring UI (Frontend)

Interfaz web interactiva de tipo Single Page Application (SPA) orientada a la visualización y control operativo del circuito de carga de gas líquido en planta. Diseñada con una arquitectura basada en componentes desacoplados y gestión de estado centralizada para garantizar sincronización en tiempo real.

### Funcionalidades clave:
* **Tablero de control y monitoreo:** Listado dinámico de órdenes con soporte de filtros por estado operativo, detalles de camión, chofer y variables en vivo (masa acumulada, caudal, densidad y temperatura)[cite: 1, 5, 9].
* **Cálculo de ETA en tiempo real:** Estimación automática del tiempo restante de llenado según el preset fijado, la masa acumulada y la tasa de caudal[cite: 9].
* **Gestión de alarmas térmicas:** Notificación visual ante desvíos de temperatura configurados en planta y panel de aceptación/reconocimiento para operadores autorizados[cite: 9].
* **Módulo de conciliación:** Consulta y renderizado analítico del balance final de carga para órdenes en estado completado[cite: 4, 9].
* **Seguridad y experiencia de usuario:** Rutas protegidas mediante autenticación y roles, diseño responsivo y feedback interactivo ante estados de carga (*loading*, *empty states* y manejo de errores)[cite: 9, 13, 18].
