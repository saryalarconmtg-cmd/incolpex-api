jest.mock('../src/config/database', () => ({ query: jest.fn() }));
jest.mock('../src/modules/xubio/xubio.service', () => ({
  createPresupuesto: jest.fn(),
  createFactura: jest.fn(),
  obtenerMovimientos: jest.fn(),
}));

const request = require('supertest');
const pool = require('../src/config/database');
const xubioService = require('../src/modules/xubio/xubio.service');
const app = require('../src/server');

const { mapCotizacionAPresupuesto, mapOrdenAFactura } = jest.requireActual('../src/modules/xubio/xubio.service');

describe('mapeo de campos', () => {
  it('mapea una cotización a presupuesto Xubio', () => {
    const presupuesto = mapCotizacionAPresupuesto({
      id: 1, cliente_id: 5, producto: 'Audifonos', cantidad: 10, precio_final: 200,
    });

    expect(presupuesto.cliente_id).toBe(5);
    expect(presupuesto.total).toBe(200);
    expect(presupuesto.referencia_externa).toBe('cotizacion-1');
    expect(presupuesto.items[0].descripcion).toBe('Audifonos');
    expect(presupuesto.items[0].precio_unitario).toBe(20);
  });

  it('mapea una orden confirmada a factura Xubio', () => {
    const factura = mapOrdenAFactura({
      id: 7, cliente_id: 3, producto: 'Mouse', cantidad: 5, precio_final: 100,
    });

    expect(factura.cliente_id).toBe(3);
    expect(factura.total).toBe(100);
    expect(factura.referencia_externa).toBe('orden-7');
    expect(factura.items[0].precio_unitario).toBe(20);
  });
});

describe('POST /api/xubio/presupuesto', () => {
  beforeEach(() => {
    pool.query.mockReset();
    xubioService.createPresupuesto.mockReset();
  });

  it('retorna 400 si falta cotizacion_id', async () => {
    const res = await request(app).post('/api/xubio/presupuesto').send({});
    expect(res.status).toBe(400);
    expect(xubioService.createPresupuesto).not.toHaveBeenCalled();
  });

  it('retorna 404 si la cotización no existe', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/api/xubio/presupuesto').send({ cotizacion_id: 99 });
    expect(res.status).toBe(404);
    expect(xubioService.createPresupuesto).not.toHaveBeenCalled();
  });

  it('crea el presupuesto y retorna 201', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 1, cliente_id: 5, producto: 'Audifonos', cantidad: 10, precio_final: 200, estado: 'pending',
      }],
    });
    xubioService.createPresupuesto.mockResolvedValueOnce({ id: 'xub-presupuesto-1' });

    const res = await request(app).post('/api/xubio/presupuesto').send({ cotizacion_id: 1 });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('xub-presupuesto-1');
  });

  it('retorna 502 si Xubio falla', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 1, cliente_id: 5, producto: 'Audifonos', cantidad: 10, precio_final: 200, estado: 'pending',
      }],
    });
    xubioService.createPresupuesto.mockRejectedValueOnce(new Error('timeout'));

    const res = await request(app).post('/api/xubio/presupuesto').send({ cotizacion_id: 1 });
    expect(res.status).toBe(502);
  });
});

describe('POST /api/xubio/factura', () => {
  beforeEach(() => {
    pool.query.mockReset();
    xubioService.createFactura.mockReset();
  });

  it('retorna 400 si falta orden_id', async () => {
    const res = await request(app).post('/api/xubio/factura').send({});
    expect(res.status).toBe(400);
    expect(xubioService.createFactura).not.toHaveBeenCalled();
  });

  it('retorna 404 si la orden no existe', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/api/xubio/factura').send({ orden_id: 99 });
    expect(res.status).toBe(404);
  });

  it('retorna 422 si la orden no está confirmada', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 1, cliente_id: 5, producto: 'Audifonos', cantidad: 10, precio_final: 200, estado: 'pending',
      }],
    });

    const res = await request(app).post('/api/xubio/factura').send({ orden_id: 1 });

    expect(res.status).toBe(422);
    expect(xubioService.createFactura).not.toHaveBeenCalled();
  });

  it('crea la factura y retorna 201 si la orden está confirmada', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 1, cliente_id: 5, producto: 'Audifonos', cantidad: 10, precio_final: 200, estado: 'accepted',
      }],
    });
    xubioService.createFactura.mockResolvedValueOnce({ id: 'xub-factura-1' });

    const res = await request(app).post('/api/xubio/factura').send({ orden_id: 1 });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('xub-factura-1');
  });
});

describe('GET /api/xubio/sincronizar', () => {
  beforeEach(() => {
    pool.query.mockReset();
    xubioService.obtenerMovimientos.mockReset();
  });

  it('sincroniza movimientos y actualiza la BD local', async () => {
    xubioService.obtenerMovimientos.mockResolvedValueOnce([
      {
        id: 'mov-1', tipo: 'factura', monto: 200, fecha: '2026-07-01',
      },
    ]);
    pool.query
      .mockResolvedValueOnce({ affectedRows: 1 })
      .mockResolvedValueOnce({
        rows: [{
          id: 1, xubio_id: 'mov-1', tipo: 'factura', monto: 200, fecha: '2026-07-01',
        }],
      });

    const res = await request(app).get('/api/xubio/sincronizar');

    expect(res.status).toBe(200);
    expect(res.body.sincronizados).toBe(1);
    expect(res.body.movimientos[0].xubio_id).toBe('mov-1');
  });

  it('retorna 502 si falla la sincronización con Xubio', async () => {
    xubioService.obtenerMovimientos.mockRejectedValueOnce(new Error('timeout'));

    const res = await request(app).get('/api/xubio/sincronizar');
    expect(res.status).toBe(502);
  });
});
