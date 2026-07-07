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

2. Copiar `.env.example` a `.env` y ajustar los valores si es necesario:

   ```
   cp .env.example .env
   ```

3. Levantar el servidor:

   ```
   npm run dev
   ```

El servidor quedará disponible en `http://localhost:3000`.

## Base de datos

Requiere PostgreSQL corriendo en `localhost:5432` (o el host/puerto configurado en `.env`).

1. Crear la base de datos y aplicar las migraciones (crea todas las tablas: `users`, `clientes`,
   `cotizaciones`, `shipments`, `xubio_movimientos`):

   ```
   npm run setup-db
   ```

2. Agregar datos de prueba:

   ```
   npm run seed
   ```

   Esto crea:
   - Usuario admin: `admin@incolpex.com` / `admin123`
   - Cliente de prueba: Test Client (`+5691234567`)
   - Cotización de prueba: Widget, cantidad 100, precio China $5
   - Shipment de prueba: tracking `1234567890`

   El seed es seguro de re-ejecutar: si los datos ya existen, los omite en vez de duplicarlos.
