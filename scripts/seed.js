require('dotenv').config();

const pool = require('../src/config/database');
const authModel = require('../src/modules/auth/auth.model');
const authService = require('../src/modules/auth/auth.service');
const clienteModel = require('../src/modules/clientes/cliente.model');
const cotizacionModel = require('../src/modules/cotizaciones/cotizacion.model');
const { calcularPrecioFinal } = require('../src/modules/cotizaciones/cotizacion.controller');
const fedexModel = require('../src/modules/fedex/fedex.model');

const SHIPPING_DEFAULT = Number(process.env.SHIPPING_DEFAULT) || 50;

async function seedAdmin() {
  const existente = await authModel.findByEmail('admin@incolpex.com');
  if (existente) {
    console.log('✓ Usuario admin ya existe, se omite');
    return existente;
  }

  const password_hash = await authService.hashPassword('admin123');
  const admin = await authModel.create({
    nombre: 'Admin', email: 'admin@incolpex.com', password_hash,
  });
  console.log('✓ Usuario admin creado (admin@incolpex.com / admin123)');
  return admin;
}

async function seedCliente() {
  const existente = await clienteModel.findByTelefono('+5691234567');
  if (existente) {
    console.log('✓ Cliente de prueba ya existe, se omite');
    return existente;
  }

  const cliente = await clienteModel.create({
    nombre: 'Test Client',
    telefono: '+5691234567',
  });
  console.log(`✓ Cliente de prueba creado (id=${cliente.id})`);
  return cliente;
}

async function seedCotizacion(clienteId) {
  const precio_unitario_china = 5;
  const cantidad = 100;
  const margen_porcentaje = 20;
  const shipping = SHIPPING_DEFAULT;
  const precio_final = calcularPrecioFinal({
    precio_unitario_china, cantidad, margen_porcentaje, shipping,
  });

  const cotizacion = await cotizacionModel.create({
    cliente_id: clienteId,
    producto: 'Widget',
    cantidad,
    precio_unitario_china,
    shipping,
    margen_porcentaje,
    precio_final,
  });
  console.log(`✓ Cotización de prueba creada (id=${cotizacion.id})`);
  return cotizacion;
}

async function seedShipment(cotizacionId) {
  const existente = await fedexModel.findByTrackingNumber('1234567890');
  if (existente) {
    console.log('✓ Shipment de prueba ya existe, se omite');
    return existente;
  }

  const shipment = await fedexModel.create({
    cotizacion_id: cotizacionId,
    direccion_destino: {
      calle: 'Calle de prueba 123', ciudad: 'Bogota', codigo_postal: '110111', pais: 'CO',
    },
    peso: 2.5,
    dimensiones: { largo: 20, ancho: 15, alto: 10 },
    tracking_number: '1234567890',
    etiqueta_url: null,
  });
  console.log(`✓ Shipment de prueba creado (tracking=${shipment.tracking_number})`);
  return shipment;
}

async function seed() {
  await seedAdmin();
  const cliente = await seedCliente();
  const cotizacion = await seedCotizacion(cliente.id);
  await seedShipment(cotizacion.id);
  await pool.end();
  console.log('Seed completado.');
}

seed().catch((error) => {
  console.error('Error al ejecutar el seed:', error.message);
  process.exit(1);
});
