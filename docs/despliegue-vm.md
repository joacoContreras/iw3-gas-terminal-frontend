# Configuración de la VM (16/11/2026)

**Qué es:** lo que se configuró en la VM de producción para cerrar los pendientes de seguridad del backend (H-5) y de roles (Fase 1), con acceso del usuario y su autorización. El repositorio del backend no se modificó; esta documentación vive acá.
**Alcance:** `JWT_SECRET`, `CORS_ALLOWED_ORIGINS`, roles faltantes y los 6 usuarios por rol. Incluye el **correo real (SMTP)**, que se configuró después (sección 8).

## 1. Cómo está armada la VM

| Pieza | Detalle |
|---|---|
| Host | `143.0.100.187` (Ubuntu, 1 vCPU, 3,4 GB), usuario `user` |
| Contenedores | `iw3-app` (backend, `:8080`), `iw3-frontend` (`:3000`), `iw3-mysql-prod` (base `iw3_prod_2026`) y `nginx` (`:443`) |
| `https://jc755.duckdns.org` | **Es el backend**: nginx hace `proxy_pass` a `app:8080`. El frontend **no** se sirve por HTTPS: está en `http://143.0.100.187:3000` |
| Despliegue del backend | El workflow corre `~/infra/deploy.sh`: actualiza `~/apps/iw3_2026`, construye `iw3-app:latest` y hace `docker compose up -d` desde `~/infra` |
| Despliegue del frontend | El workflow compila la imagen en el runner, la copia por SCP y reinicia `iw3-frontend` con `docker run` (la URL de la API se fija al compilar: `http://143.0.100.187:8080/api/v1`) |

**Consecuencia:** las variables del backend **tienen que estar en `~/infra`** (compose y `.env`); así sobreviven a cada despliegue. Lo que se pusiera solo en un contenedor se perdería en el próximo `compose up`.

## 2. Qué se cambió

| Cambio | Dónde | Detalle |
|---|---|---|
| Respaldo | `~/infra/docker-compose.yml.bak-20261116-011236` | Copia previa al cambio (se restaura con `cp` y `docker compose up -d --no-deps app`) |
| `.env` nuevo | `~/infra/.env`, permisos **600** | `JWT_SECRET` (64 caracteres aleatorios generados en la VM, nunca mostrados), `CORS_ALLOWED_ORIGINS=http://143.0.100.187:3000,https://jc755.duckdns.org`, `SMTP_USER=` y `SMTP_PASS=` vacíos |
| `docker-compose.yml` | servicio `app` | Cuatro líneas nuevas: `JWT_SECRET`, `CORS_ALLOWED_ORIGINS`, `SMTP_USER` y `SMTP_PASS`, todas como `${NOMBRE:-}` (un valor vacío no rompe nada: el backend usa su respaldo) |
| Contenedor | solo `iw3-app` | Se recreó con `docker compose up -d --no-deps app` (~1 minuto sin servicio). MySQL, nginx y el frontend no se tocaron |
| Base de datos | `iw3_prod_2026` | Roles `ROLE_SUPERVISOR`, `ROLE_OPERADOR`, `ROLE_SAP`, `ROLE_TMS` y `ROLE_LOADER`; usuarios `admin`, `supervisor`, `operador`, `sap`, `tms` y `loader`, con los tres flags `account_*` y `credentials_non_expired` en 1 (con 0 el login falla) |

Efectos visibles: se cerraron **todas las sesiones** (los tokens viejos dejaron de valer), el aviso «se usa la clave por defecto» desapareció del log del backend y los orígenes ajenos ya no pasan CORS.

## 3. Usuarios

| Usuario | Rol |
|---|---|
| `martin` | `ROLE_ADMIN` (ya existía; conserva su contraseña) |
| `admin`, `supervisor`, `operador`, `sap`, `tms`, `loader` | el rol de su nombre |

Las contraseñas de los seis nuevos se generaron al azar (16 caracteres) y están en **`C:\Users\Martin\vm-credenciales.txt`**, fuera de los repositorios. **No se suben a ningún repositorio.** Las contraseñas de desarrollo (`admin123`, `<usuario>123`) **no existen** en la VM (se comprobó que dan 401). En la base solo hay hashes BCrypt.

## 4. Verificaciones ejecutadas (16/11/2026)

| Prueba | Resultado |
|---|---|
| Login de los 6 usuarios por `:8080` y por el dominio HTTPS | 200 con el rol correcto en el token |
| Contraseña incorrecta, `admin/admin123` y `operador/operador123` | 401 |
| Matriz de roles contra la VM (`GET` de órdenes, alarmas y configuración; escrituras que deben dar 403) | **98 de 98**, por `:8080` y por el dominio |
| Un JWT firmado con la clave vieja del repositorio | **401** (ya no sirve) |
| CORS: origen `http://143.0.100.187:3000` y `https://jc755.duckdns.org` | permitidos (eco del origen) |
| CORS: origen ajeno (`http://sitio-malicioso.example`) y `http://localhost:3000` | **403, sin cabecera de permiso** |
| **Chrome real contra el frontend desplegado** (el mismo guion de la verificación de `main`: 6 roles, órdenes, ETA, conciliación, alarmas, simulador y *polling*) | **110 de 110** |

La base de producción quedó con datos de las pruebas: **61 órdenes** (45 previas y las que crearon las pruebas del 16/11; las nuevas tienen camión `E2E123`) y **3 alarmas** (todas con «Correo no enviado», porque no hay SMTP).

## 5. Procedimientos (para el equipo)

Todos desde `ssh user@143.0.100.187`. **Nunca** pegar secretos en el chat ni en un repositorio.

- **Rotar `JWT_SECRET`:** editar `~/infra/.env` (32 caracteres o más) y `cd ~/infra && docker compose up -d --no-deps app`. Cierra todas las sesiones.
- **Cambiar la contraseña de un usuario:** generar el hash fuera de la VM (`python -c "import bcrypt;print(bcrypt.hashpw(b'NUEVA',bcrypt.gensalt(10)).decode().replace('\$2b\$','\$2a\$',1))"`) y `UPDATE users SET password='<hash>' WHERE username='operador';` en `iw3_prod_2026` (`docker exec -it iw3-mysql-prod sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" iw3_prod_2026'`).
- **Limitar CORS a otro origen** (por ejemplo, si el frontend pasa a HTTPS): cambiar `CORS_ALLOWED_ORIGINS` en `~/infra/.env` y recrear `app`. Si el sitio se sirviera por HTTPS, hay que compilar el frontend con una `NEXT_PUBLIC_API_URL` HTTPS (si no, el navegador bloquea el contenido mixto).
- **Volver atrás:** `cd ~/infra && cp docker-compose.yml.bak-20261116-011236 docker-compose.yml && mv .env .env.off && docker compose up -d --no-deps app` (vuelve a la clave por defecto y a CORS abierto).
- **Ver el estado:** `docker ps`, `docker logs --tail 50 iw3-app`.

## 6. Pendientes

| Pendiente | Qué hace falta |
|---|---|
| ~~Correo real (SMTP, D-12)~~ | **Hecho y confirmado** el 16/11/2026: el destinatario recibió el mensaje (sección 8) |
| Datos de prueba | Las órdenes y alarmas de prueba siguen en la base de producción; se pueden dejar (es el entorno de la materia) o limpiar con el SQL de `CLAUDE.md` del backend, sección 12 |
| Limpiar los 120 commits con coautor de Claude del `main` del backend | Exige `push --force` y coordinar con el equipo (rama `main-limpio` guardada en una copia local) |

## 7. Observaciones

- **Con un cuerpo inválido, `POST /integration/sap/orders` responde 400 antes de evaluar el rol** (Spring rechaza el cuerpo primero): un operador que manda `{}` recibe 400, y uno que manda un cuerpo válido recibe 403. No es un fallo de configuración: así lo documenta la Fase 1 del backend. Lo que no hay es un cambio de datos sin permiso.
- **`http://localhost:3000` no está permitido** por CORS en la VM. Quien quiera probar un frontend local contra la API de la VM debe agregar ese origen a `CORS_ALLOWED_ORIGINS` (no se hizo para no abrir de más).
- **Un login tardó 22 s una vez** durante la prueba con Chrome (el resto, entre 170 y 400 ms; la VM tiene 1 vCPU y estaba tranquila). No se repitió y no se encontró causa; queda como observación.
- **Esto no cambió el código ni el CI de ningún repositorio.**
- **Decisión del usuario (16/11/2026): las credenciales se dejan como están.** La contraseña de aplicación de Gmail y la contraseña SSH de la VM, que se compartieron por chat para esta tarea, **no se rotan**: se dejan así a propósito, y por eso no figuran como pendientes. Quien lea esto debe saber que esas dos credenciales pasaron por una conversación.

## 8. Correo real (SMTP), 16/11/2026

| Paso | Detalle |
|---|---|
| Cuenta | `martin.gonzale01@gmail.com` (la institucional `@alumnos.iua.edu.ar`, de Google Workspace, no admitió la contraseña de aplicación). Servidor `smtp.gmail.com:587` con STARTTLS, que es el que el backend trae por defecto; se comprobó antes que la VM llega a él |
| Variables | `SMTP_USER` y `SMTP_PASS` (contraseña de aplicación de 16 letras) en `~/infra/.env`, permisos 600. Respaldo previo: `~/infra/.env.bak-20261116-013937` |
| Aplicación | `docker compose up -d --no-deps app` (~60 s sin servicio). **No se cambió `JWT_SECRET`**: las sesiones abiertas siguieron valiendo |
| Destinatario | `PUT /alarms/config` como `admin`: `recipientEmails: ["martin.gonzale01@gmail.com"]`; el umbral quedó en 30 °C (el valor por defecto) |

**Prueba real** (orden de prueba `1393301182`, camión `MAIL01`, cliente «PRUEBA DE CORREO»):

1. Una lectura a 25 °C (bajo el umbral): guardada, **sin alarma**.
2. Una lectura a **38 °C**: guardada (`saved: true`) y **alarma `PENDING` creada**; ocho segundos después el backend registró `emailSentAt` (el servidor de Gmail aceptó el mensaje). El log no muestra errores de correo.
3. Una segunda lectura caliente (39 °C): guardada, **sin segunda alarma ni segundo correo** (D-3: una pendiente por orden).

**Confirmación de recepción:** `emailSentAt` indica que Gmail aceptó el envío; la llegada a la casilla la confirmó la persona destinataria (Martín González, 16/11/2026): **el correo llegó**.

La base de producción quedó con **62 órdenes y 4 alarmas** (las nuevas son de prueba).
