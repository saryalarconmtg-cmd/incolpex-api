jest.mock('../src/config/database', () => ({ query: jest.fn() }));
jest.mock('../src/modules/whatsapp/whatsapp.service', () => ({ sendMessage: jest.fn() }));

const request = require('supertest');
const pool = require('../src/config/database');
const whatsappService = require('../src/modules/whatsapp/whatsapp.service');
const app = require('../src/server');
const {
  validarTelefono,
  formatearMensajeCotizacion,
  formatearMensajeRecordatorio,
  formatearMensajeTracking,
} = require('../src/modules/whatsapp/whatsapp.controller');

describe('validarTelefono', () => {
  it.each([
    ['+56912345678', true],
    ['+573001234567', true],
    ['+5691234567', true],
    ['56912345678', false],
    ['+5491122334455', false],
    ['+56123456', false],
    ['+571234567890123', false],
    ['', false],
  ])('validarTelefono(%s) => %s', (telefono, esperado) => {
    expect(validarTelefono(telefono)).toBe(esperado);
  });
});

describe('formato de mensajes', () => {
  it('formatea el mensaje de cotización con los datos clave', () => {
    const mensaje = formatearMensajeCotizacion({
      id: 5, producto: 'Audifonos', cantidad: 100, precio_final: 700, estado: 'pending',
    });
    expect(mensaje).toContain('#5');
    expect(mensaje).toContain('Audifonos');
    expect(mensaje).toContain('700');
  });

  it('formatea el mensaje de recordatorio con tarea y fecha', () => {
    const mensaje = formatearMensajeRecordatorio({ tarea: 'Revisar guía FedEx', fecha: '2026-07-10' });
    expect(mensaje).toContain('Revisar guía FedEx');
    expect(mensaje).toContain('2026-07-10');
  });

  it('formatea el mensaje de tracking con el número de guía', () => {
    const mensaje = formatearMensajeTracking('FDX123456');
    expect(mensaje).toContain('FDX123456');
  });
});

describe('POST /api/whatsapp/send', () => {
  beforeEach(() => {
    whatsappService.sendMessage.mockReset();
  });

  it('retorna 400 si faltan campos', async () => {
    const res = await request(app).post('/api/whatsapp/send').send({ telefono: '+56912345678' });
    expect(res.status).toBe(400);
    expect(whatsappService.sendMessage).not.toHaveBeenCalled();
  });

  it('retorna 422 si el teléfono no tiene formato +56 o +57', async () => {
    const res = await request(app).post('/api/whatsapp/send').send({
      telefono: '+5491122334455', mensaje: 'Hola',
    });
    expect(res.status).toBe(422);
    expect(whatsappService.sendMessage).not.toHaveBeenCalled();
  });

  it('envía el mensaje y retorna 200 con el messageId', async () => {
    whatsappService.sendMessage.mockResolvedValueOnce({ messageId: 'wamid.001' });

    const res = await request(app).post('/api/whatsapp/send').send({
      telefono: '+56912345678', mensaje: 'Hola',
    });

    expect(res.status).toBe(200);
    expect(res.body.messageId).toBe('wamid.001');
    expect(whatsappService.sendMessage).toHaveBeenCalledWith('+56912345678', 'Hola');
  });

  it('retorna 502 si la llamada a WhatsApp falla', async () => {
    whatsappService.sendMessage.mockRejectedValueOnce(new Error('timeout'));

    const res = await request(app).post('/api/whatsapp/send').send({
      telefono: '+56912345678', mensaje: 'Hola',
    });

    expect(res.status).toBe(502);
  });
});

describe('POST /api/whatsapp/enviar-cotizacion', () => {
  beforeEach(() => {
    pool.query.mockReset();
    whatsappService.sendMessage.mockReset();
  });

  it('retorna 400 si faltan campos', async () => {
    const res = await request(app).post('/api/whatsapp/enviar-cotizacion').send({});
    expect(res.status).toBe(400);
  });

  it('retorna 404 si la cotización no existe', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/api/whatsapp/enviar-cotizacion').send({
      cliente_id: 1, cotizacion_id: 99,
    });
    expect(res.status).toBe(404);
  });

  it('retorna 404 si el cliente no tiene teléfono registrado', async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [{
          id: 1, producto: 'x', cantidad: 1, precio_final: 10, estado: 'pending',
        }],
      })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app).post('/api/whatsapp/enviar-cotizacion').send({
      cliente_id: 1, cotizacion_id: 1,
    });
    expect(res.status).toBe(404);
  });

  it('envía el mensaje y retorna 200 con el messageId', async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [{
          id: 1, producto: 'Audifonos', cantidad: 100, precio_final: 700, estado: 'pending',
        }],
      })
      .mockResolvedValueOnce({ rows: [{ telefono: '+56912345678' }] });
    whatsappService.sendMessage.mockResolvedValueOnce({ messageId: 'wamid.123' });

    const res = await request(app).post('/api/whatsapp/enviar-cotizacion').send({
      cliente_id: 1, cotizacion_id: 1,
    });

    expect(res.status).toBe(200);
    expect(res.body.messageId).toBe('wamid.123');
    expect(whatsappService.sendMessage).toHaveBeenCalledWith('+56912345678', expect.any(String), 'cotizacion');
  });
});

describe('POST /api/whatsapp/recordatorio-equipo', () => {
  beforeEach(() => {
    whatsappService.sendMessage.mockReset();
  });

  it('retorna 400 si faltan campos', async () => {
    const res = await request(app).post('/api/whatsapp/recordatorio-equipo').send({ tarea: 'x' });
    expect(res.status).toBe(400);
  });

  it('retorna 422 si asignado_a no tiene formato de teléfono válido', async () => {
    const res = await request(app).post('/api/whatsapp/recordatorio-equipo').send({
      tarea: 'Revisar guía', asignado_a: '12345', fecha: '2026-07-10',
    });
    expect(res.status).toBe(422);
    expect(whatsappService.sendMessage).not.toHaveBeenCalled();
  });

  it('envía el recordatorio y retorna 200', async () => {
    whatsappService.sendMessage.mockResolvedValueOnce({ messageId: 'wamid.456' });
    const res = await request(app).post('/api/whatsapp/recordatorio-equipo').send({
      tarea: 'Revisar guía', asignado_a: '+573001234567', fecha: '2026-07-10',
    });
    expect(res.status).toBe(200);
    expect(res.body.messageId).toBe('wamid.456');
  });
});

describe('POST /api/whatsapp/notificar-tracking', () => {
  beforeEach(() => {
    pool.query.mockReset();
    whatsappService.sendMessage.mockReset();
  });

  it('retorna 400 si faltan campos', async () => {
    const res = await request(app).post('/api/whatsapp/notificar-tracking').send({ cliente_id: 1 });
    expect(res.status).toBe(400);
  });

  it('retorna 404 si el cliente no tiene teléfono registrado', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/api/whatsapp/notificar-tracking').send({
      tracking_number: 'FDX123456', cliente_id: 1,
    });
    expect(res.status).toBe(404);
  });

  it('envía la notificación y retorna 200', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ telefono: '+56912345678' }] });
    whatsappService.sendMessage.mockResolvedValueOnce({ messageId: 'wamid.789' });

    const res = await request(app).post('/api/whatsapp/notificar-tracking').send({
      tracking_number: 'FDX123456', cliente_id: 1,
    });

    expect(res.status).toBe(200);
    expect(whatsappService.sendMessage).toHaveBeenCalledWith('+56912345678', expect.any(String), 'tracking');
  });
});
