const request = require('supertest');

jest.mock('../src/config/database', () => ({
  query: jest.fn(),
}));

const pool = require('../src/config/database');
const app = require('../src/server');
const { calcularPrecioFinal } = require('../src/modules/cotizaciones/cotizacion.controller');
const { generarTokenPrueba } = require('./helpers/testAuth');

const token = generarTokenPrueba();

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
    pool.query
      .mockImplementationOnce((sql, params) => Promise.resolve({ insertId: 1, params }))
      .mockImplementationOnce((sql, [id]) => Promise.resolve({
        rows: [
          {
            id,
            cliente_id: 1,
            producto: 'Audifonos bluetooth',
            cantidad: 100,
            precio_unitario_china: 5,
            shipping: 50,
            margen_porcentaje: 30,
            precio_final: 700,
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

describe('GET /api/cotizaciones', () => {
  beforeEach(() => {
    pool.query.mockReset();
  });

  it('retorna 401 sin token', async () => {
    const res = await request(app).get('/api/cotizaciones');
    expect(res.status).toBe(401);
  });

  it('retorna la lista de cotizaciones con token válido', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, producto: 'Audifonos', estado: 'pending' }],
    });

    const res = await request(app).get('/api/cotizaciones').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

describe('GET /api/cotizaciones/:id', () => {
  beforeEach(() => {
    pool.query.mockReset();
  });

  it('retorna 401 sin token', async () => {
    const res = await request(app).get('/api/cotizaciones/1');
    expect(res.status).toBe(401);
  });

  it('retorna 404 si no existe', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/cotizaciones/99').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('retorna la cotización con token válido', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, producto: 'Audifonos', estado: 'pending' }] });
    const res = await request(app).get('/api/cotizaciones/1').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });
});

describe('PATCH /api/cotizaciones/:id/estado', () => {
  beforeEach(() => {
    pool.query.mockReset();
  });

  it('retorna 401 sin token', async () => {
    const res = await request(app).patch('/api/cotizaciones/1/estado').send({ estado: 'accepted' });
    expect(res.status).toBe(401);
  });

  it('retorna 400 si el estado no es válido', async () => {
    const res = await request(app)
      .patch('/api/cotizaciones/1/estado')
      .set('Authorization', `Bearer ${token}`)
      .send({ estado: 'en_proceso' });

    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('retorna 404 si la cotización no existe', async () => {
    pool.query.mockResolvedValueOnce({ affectedRows: 0 });
    const res = await request(app)
      .patch('/api/cotizaciones/99/estado')
      .set('Authorization', `Bearer ${token}`)
      .send({ estado: 'accepted' });
    expect(res.status).toBe(404);
  });

  it('actualiza el estado y lo retorna', async () => {
    pool.query
      .mockResolvedValueOnce({ affectedRows: 1 })
      .mockResolvedValueOnce({ rows: [{ id: 1, estado: 'accepted' }] });
    const res = await request(app)
      .patch('/api/cotizaciones/1/estado')
      .set('Authorization', `Bearer ${token}`)
      .send({ estado: 'accepted' });

    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('accepted');
  });
});
