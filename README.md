# Incolpex API

API REST para la gestión de cotizaciones de importaciones desde China.

## Requisitos

- Node.js
- PostgreSQL

## Setup

1. Instalar dependencias:

   ```
   npm install
   ```

2. Configurar variables de entorno en `.env`:

   ```
   DB_HOST=localhost
   DB_USER=postgres
   DB_PASS=postgres
   DB_NAME=incolpex
   JWT_SECRET=change_this_secret
   PORT=3000
   ```

3. Levantar el servidor:

   ```
   npm run dev
   ```

El servidor quedará disponible en `http://localhost:3000`.
