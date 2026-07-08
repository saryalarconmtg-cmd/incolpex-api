# Guía de despliegue en cPanel — api.incolpex.com

Esta guía asume un hosting cPanel con:
- **MySQL** (cPanel > Databases > MySQL Database Wizard) — es la base de
  datos que cPanel ofrece de forma nativa en prácticamente todos los planes.
- **"Setup Node.js App"** disponible (cPanel > Software), que usa Phusion
  Passenger para correr y supervisar el proceso Node.

> **Nota importante sobre el proceso Node:** la petición original de este
> despliegue incluía instalar PM2 y un cron job que lo reinicie si falla. En
> cPanel con "Setup Node.js App", el proceso **no se administra con PM2**:
> lo administra Passenger, que ya reinicia la app automáticamente si se cae
> o si el proceso se actualiza. Un demonio de PM2 corriendo por su cuenta no
> sobrevive de forma confiable en el entorno restringido de un hosting
> compartido y competiría con Passenger por el mismo proceso/puerto. En su
> lugar, esta guía usa el mecanismo real de reinicio de Passenger (tocar
> `tmp/restart.txt`) más un cron de *healthcheck* que lo dispara si la app
> deja de responder — ver Paso 8.

## Prerrequisitos

- Acceso SSH a la cuenta de cPanel.
- El repositorio es público en GitHub: `https://github.com/saryalarconmtg-cmd/incolpex-api.git`.
- Un dominio principal ya configurado en cPanel (ej. `incolpex.com`).

## Paso 1: Crear el subdominio `api.incolpex.com`

**Por la interfaz de cPanel:**
1. cPanel > Domains > Create A New Domain.
2. Domain: `api.incolpex.com`.
3. Document Root: `api.incolpex.com` (queda en `/home/usuario/api.incolpex.com`).
4. Crear.

**Por SSH (alternativa vía `uapi`, si tu proveedor lo permite):**
```bash
uapi SubDomain addsubdomain domain=api rootdomain=incolpex.com dir=public_html/api.incolpex.com
```

## Paso 2: Crear la base de datos MySQL

**Por la interfaz de cPanel:**
1. cPanel > Databases > MySQL Database Wizard.
2. Crear una base de datos (ej. `incolpex`, cPanel la prefija con tu usuario:
   `usuario_incolpex`).
3. Crear un usuario con contraseña segura.
4. Asignar el usuario a la base de datos con todos los privilegios.
5. Anota el nombre final de la BD y el usuario (con el prefijo) — los
   necesitas para `.env` en el Paso 6.

**Por SSH (alternativa vía `uapi`):**
```bash
uapi Mysql create_database name=incolpex
uapi Mysql create_user name=incolpex password='TU_PASSWORD_SEGURO'
uapi Mysql set_privileges_on_database user=incolpex database=incolpex privileges=ALL
```

## Paso 3: Clonar el repositorio

Por SSH, dentro de la carpeta del subdominio:
```bash
git clone https://github.com/saryalarconmtg-cmd/incolpex-api.git ~/api.incolpex.com
```
Si la carpeta ya la creó el Paso 1 y no está vacía, cloná en un directorio
temporal y movés el contenido, o usá `git clone` directo a una carpeta nueva
y apuntá el Document Root del subdominio ahí.

## Paso 4: Configurar la app en "Setup Node.js App"

1. cPanel > Software > Setup Node.js App > Create Application.
2. **Node.js version:** la más reciente disponible (18 o superior).
3. **Application mode:** Production.
4. **Application root:** `api.incolpex.com` (la carpeta clonada en el Paso 3).
5. **Application URL:** `api.incolpex.com`.
6. **Application startup file:** `src/server.js`.
7. Guardar. cPanel crea un entorno virtual de Node en
   `~/nodevenv/api.incolpex.com/<version>/`.

## Paso 5: Variables de entorno

Copiá la plantilla y completá los valores reales:
```bash
cp ~/api.incolpex.com/.env.production ~/api.incolpex.com/.env
```
Editá `.env` con:
- `DB_USER` / `DB_PASS` / `DB_NAME`: los datos creados en el Paso 2.
- `JWT_SECRET`: un valor largo y aleatorio (`openssl rand -hex 32`), distinto
  al usado en desarrollo.
- Las credenciales reales de FedEx / WhatsApp / Xubio cuando las tengas.

No definas `PORT`: "Setup Node.js App" lo asigna automáticamente y el
servidor ya usa `process.env.PORT`.

## Paso 6: Instalar dependencias

Desde la sección "Setup Node.js App" en cPanel, usá el botón **"Run NPM
Install"** (activa el entorno virtual correcto automáticamente), o por SSH:
```bash
source ~/nodevenv/api.incolpex.com/18/bin/activate
cd ~/api.incolpex.com
npm install --production
deactivate
```

## Paso 7: Crear las tablas

Con las mismas credenciales del Paso 5 ya en `.env`:
```bash
cd ~/api.incolpex.com
node src/migrations/001_create_tables.js
```
Esto crea `users`, `clientes`, `cotizaciones`, `shipments` y
`xubio_movimientos` si no existen. Si querés datos de prueba, `npm run seed`
(ver README.md principal) — usalo solo en un ambiente de pruebas, no en
producción con datos reales de clientes.

## Paso 8: Reinicio automático si la app falla

Passenger reinicia el proceso si se cae, pero para forzar un reinicio o
detectar que la app dejó de responder (por ejemplo tras un `git pull` con
cambios), usá el script de *healthcheck*:

1. Subí/actualizá `scripts/healthcheck-restart.sh` (ya viene en el repo).
2. cPanel > Cron Jobs > agregar, cada 5 minutos:
   ```
   */5 * * * * APP_DIR=/home/usuario/api.incolpex.com HEALTHCHECK_URL=https://api.incolpex.com/ bash /home/usuario/api.incolpex.com/scripts/healthcheck-restart.sh
   ```
3. El script hace `curl` al *healthcheck* y, si falla, toca
   `tmp/restart.txt` dentro de la app — la señal que Passenger usa para
   reiniciar el proceso en el siguiente request. Los resultados quedan en
   `tmp/healthcheck.log`.

## Redeploys posteriores

Para actualizar la app luego de un cambio en el repo, `scripts/deploy.sh`
automatiza los pasos 1–2 (si `uapi` está disponible) y siempre hace
`git pull`, `npm install --production`, migraciones y reinicio:
```bash
export CPANEL_USER=usuario
export DB_PASS='solo si querés que intente crear la BD automáticamente'
bash ~/api.incolpex.com/scripts/deploy.sh
```
Revisá las variables al inicio del script (`DOMINIO_PRINCIPAL`,
`SUBDOMINIO`, `NODE_VERSION`, etc.) y ajustalas a tu cuenta antes de correrlo
la primera vez.

## Troubleshooting

- **La app no arranca / 503:** cPanel > Setup Node.js App > tu app > "Errors"
  o los logs en `~/api.incolpex.com/stderr.log` (la ruta exacta depende del
  proveedor).
- **Cambios en el código no se reflejan:** tras `git pull`, tocá
  `tmp/restart.txt` (o usá el botón "Restart" en la UI de Setup Node.js App).
- **Error de conexión a MySQL:** confirmá `DB_HOST=localhost`,
  `DB_PORT=3306` y que el usuario tenga privilegios sobre la base — probá
  `mysql -u <usuario> -p -h localhost <basededatos>` por SSH.
- **`uapi` falla con "command not found" o permisos:** tu proveedor puede
  tener deshabilitado el acceso a `uapi` por SSH; hacé esos pasos puntuales
  desde la interfaz gráfica de cPanel en su lugar.
