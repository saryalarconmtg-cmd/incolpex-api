jest.mock('../src/config/database', () => ({ query: jest.fn() }));
jest.mock('../src/modules/auth/auth.service', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
  generarToken: jest.fn(),
}));

const request = require('supertest');
const pool = require('../src/config/database');
const authService = require('../src/modules/auth/auth.service');
const app = require('../src/server');

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    pool.query.mockReset();
    authService.hashPassword.mockReset();
  });

  it('retorna 400 si faltan campos', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@a.com' });
    expect(res.status).toBe(400);
  });

  it('retorna 409 si el email ya existe', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, email: 'a@a.com' }] });
    const res = await request(app).post('/api/auth/register').send({
      nombre: 'Ana', email: 'a@a.com', password: '123456',
    });
    expect(res.status).toBe(409);
  });

  it('registra el usuario y retorna 201', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ insertId: 1 })
      .mockResolvedValueOnce({ rows: [{ id: 1, nombre: 'Ana', email: 'a@a.com', rol: 'admin' }] });
    authService.hashPassword.mockResolvedValueOnce('hashed');

    const res = await request(app).post('/api/auth/register').send({
      nombre: 'Ana', email: 'a@a.com', password: '123456',
    });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe('a@a.com');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    pool.query.mockReset();
    authService.comparePassword.mockReset();
    authService.generarToken.mockReset();
  });

  it('retorna 400 si faltan campos', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'a@a.com' });
    expect(res.status).toBe(400);
  });

  it('retorna 401 si el usuario no existe', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/api/auth/login').send({ email: 'a@a.com', password: 'x' });
    expect(res.status).toBe(401);
  });

  it('retorna 401 si la contraseña es incorrecta', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, email: 'a@a.com', password_hash: 'hashed' }] });
    authService.comparePassword.mockResolvedValueOnce(false);

    const res = await request(app).post('/api/auth/login').send({ email: 'a@a.com', password: 'x' });
    expect(res.status).toBe(401);
  });

  it('retorna 200 con token si las credenciales son válidas', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 1, nombre: 'Ana', email: 'a@a.com', password_hash: 'hashed', rol: 'admin',
      }],
    });
    authService.comparePassword.mockResolvedValueOnce(true);
    authService.generarToken.mockReturnValueOnce('token-123');

    const res = await request(app).post('/api/auth/login').send({ email: 'a@a.com', password: 'x' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBe('token-123');
    expect(res.body.usuario.email).toBe('a@a.com');
  });
});
