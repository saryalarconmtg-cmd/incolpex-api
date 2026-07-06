const request = require('supertest');

jest.mock('../src/config/database', () => ({
  query: jest.fn(),
}));

const pool = require('../src/config/database');
const app = require('../src/server');
const { calcularPrecioFinal } = require('../src/modules/cotizaciones/cotizacion.controller');

describe('calcularPrecioFinal', () => {
  it('suma subtotal, shipping y margen sobre el subtotal', () => {
    const precio = calcularPrecioFinal({
      precio_unitario_china: 10,
      cantidad: 5,
      margen_porcentaje: 20,
      shipping: 50,
    });

    expect(precio).toBe(110);
  });
});

describe('POST /api/cotizaciones', () => {
  beforeEach(() => {
    pool.query.mockReset();
  });

  it('crea una cotización y retorna 201 con el id y precio_final calculado', async () => {
    pool.query.mockImplementationOnce((sql, params) => Promise.resolve({
      rows: [
        {
          id: 1,
          cliente_id: params[0],
          producto: params[1],
          cantidad: params[2],
          precio_unitario_china: params[3],
          shipping: params[4],
          margen_porcentaje: params[5],
          precio_final: params[6],
          estado: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    }));

    const res = await request(app).post('/api/cotizaciones').send({
      cliente_id: 1,
      producto: 'Audifonos bluetooth',
      cantidad: 100,
      precio_unitario_china: 5,
      margen_porcentaje: 30,
    });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(1);
    expect(res.body.estado).toBe('pending');
    expect(res.body.shipping).toBe(50);
    expect(res.body.precio_final).toBe(700);
  });

  it('retorna 400 si faltan campos requeridos', async () => {
    const res = await request(app).post('/api/cotizaciones').send({
      cliente_id: 1,
      producto: 'Audifonos bluetooth',
    });

    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('retorna 400 si los campos numéricos no son números', async () => {
    const res = await request(app).post('/api/cotizaciones').send({
      cliente_id: 1,
      producto: 'Audifonos bluetooth',
      cantidad: 'cien',
      precio_unitario_china: 5,
      margen_porcentaje: 30,
    });

    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });
});
