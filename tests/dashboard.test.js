jest.mock('../src/config/database', () => ({ query: jest.fn() }));

const request = require('supertest');
const pool = require('../src/config/database');
const app = require('../src/server');
const { generarTokenPrueba } = require('./helpers/testAuth');

const token = generarTokenPrueba();

describe('GET /api/dashboard/kpis', () => {
  beforeEach(() => {
    pool.query.mockReset();
  });

  it('retorna 401 sin token', async () => {
    const res = await request(app).get('/api/dashboard/kpis');
    expect(res.status).toBe(401);
  });

  it('retorna los KPIs con token válido', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ total: '700.00' }] })
      .mockResolvedValueOnce({ rows: [{ promedio: '25.5' }] })
      .mockResolvedValueOnce({ rows: [{ total: '3' }] });

    const res = await request(app).get('/api/dashboard/kpis').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.total_ventas_mes).toBe(700);
    expect(res.body.margen_promedio).toBe(25.5);
    expect(res.body.ordenes_pendientes).toBe(3);
  });

  it('retorna 500 si falla la consulta', async () => {
    pool.query.mockRejectedValueOnce(new Error('db down'));
    const res = await request(app).get('/api/dashboard/kpis').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
  });
});
