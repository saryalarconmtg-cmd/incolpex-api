jest.mock('../src/config/database', () => ({ query: jest.fn() }));
jest.mock('../src/modules/fedex/fedex.service', () => ({
  createShipment: jest.fn(),
  FEDEX_MAX_PESO_KG: 70,
  ORIGEN_BODEGA_CHINA: {
    calle: 'Bodega Incolpex', ciudad: 'Shenzhen', codigo_postal: '518000', pais: 'CN',
  },
}));

const request = require('supertest');
const pool = require('../src/config/database');
const fedexService = require('../src/modules/fedex/fedex.service');
const app = require('../src/server');
const { validarDireccion, validarDimensiones } = require('../src/modules/fedex/fedex.controller');

const direccionValida = {
  calle: 'Av 1', ciudad: 'Bogota', codigo_postal: '110111', pais: 'CO',
};
const dimensionesValidas = { largo: 10, ancho: 10, alto: 10 };

describe('validarDireccion', () => {
  it('reporta campos faltantes', () => {
    expect(validarDireccion({})).toEqual(expect.arrayContaining([
      expect.stringContaining('calle'),
      expect.stringContaining('ciudad'),
      expect.stringContaining('codigo_postal'),
      expect.stringContaining('pais'),
    ]));
  });

  it('rechaza un código de país que no sea ISO de 2 letras', () => {
    const errores = validarDireccion({ ...direccionValida, pais: 'COL' });
    expect(errores).toEqual(expect.arrayContaining([expect.stringContaining('pais')]));
  });

  it('acepta una dirección válida', () => {
    expect(validarDireccion(direccionValida)).toEqual([]);
  });
});

describe('validarDimensiones', () => {
  it('reporta dimensiones faltantes o no positivas', () => {
    expect(validarDimensiones({ largo: -1, ancho: 0 })).toEqual(expect.arrayContaining([
      expect.stringContaining('largo'),
      expect.stringContaining('ancho'),
      expect.stringContaining('alto'),
    ]));
  });

  it('acepta dimensiones válidas', () => {
    expect(validarDimensiones(dimensionesValidas)).toEqual([]);
  });
});

describe('POST /api/fedex/shipment', () => {
  beforeEach(() => {
    pool.query.mockReset();
    fedexService.createShipment.mockReset();
  });

  it('retorna 400 si faltan campos requeridos', async () => {
    const res = await request(app).post('/api/fedex/shipment').send({ cotizacion_id: 1 });
    expect(res.status).toBe(400);
    expect(fedexService.createShipment).not.toHaveBeenCalled();
  });

  it('retorna 400 si la dirección es inválida', async () => {
    const res = await request(app).post('/api/fedex/shipment').send({
      cotizacion_id: 1,
      direccion_destino: { calle: 'Av 1' },
      peso: 10,
      dimensiones: dimensionesValidas,
    });
    expect(res.status).toBe(400);
    expect(fedexService.createShipment).not.toHaveBeenCalled();
  });

  it('retorna 400 si peso no es numérico o es <= 0', async () => {
    const res = await request(app).post('/api/fedex/shipment').send({
      cotizacion_id: 1,
      direccion_destino: direccionValida,
      peso: 0,
      dimensiones: dimensionesValidas,
    });
    expect(res.status).toBe(400);
    expect(fedexService.createShipment).not.toHaveBeenCalled();
  });

  it('retorna 422 si el peso excede el máximo permitido por FedEx', async () => {
    const res = await request(app).post('/api/fedex/shipment').send({
      cotizacion_id: 1,
      direccion_destino: direccionValida,
      peso: 71,
      dimensiones: dimensionesValidas,
    });
    expect(res.status).toBe(422);
    expect(fedexService.createShipment).not.toHaveBeenCalled();
  });

  it('retorna 400 si las dimensiones son inválidas', async () => {
    const res = await request(app).post('/api/fedex/shipment').send({
      cotizacion_id: 1,
      direccion_destino: direccionValida,
      peso: 10,
      dimensiones: { largo: 0, ancho: 10, alto: 10 },
    });
    expect(res.status).toBe(400);
    expect(fedexService.createShipment).not.toHaveBeenCalled();
  });

  it('crea el shipment y retorna 201 con tracking_number y etiqueta_url', async () => {
    fedexService.createShipment.mockResolvedValueOnce({
      trackingNumber: 'FDX123456',
      etiquetaUrl: 'https://fedex.example.com/labels/FDX123456.pdf',
    });
    pool.query.mockImplementationOnce((sql, params) => Promise.resolve({
      rows: [{
        id: 1,
        cotizacion_id: params[0],
        direccion_destino: JSON.parse(params[1]),
        peso: params[2],
        dimensiones: JSON.parse(params[3]),
        tracking_number: params[4],
        etiqueta_url: params[5],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }],
    }));

    const res = await request(app).post('/api/fedex/shipment').send({
      cotizacion_id: 1,
      direccion_destino: direccionValida,
      peso: 10,
      dimensiones: dimensionesValidas,
    });

    expect(res.status).toBe(201);
    expect(res.body.tracking_number).toBe('FDX123456');
    expect(res.body.etiqueta_url).toBe('https://fedex.example.com/labels/FDX123456.pdf');
  });

  it('retorna 502 si la llamada a FedEx falla', async () => {
    fedexService.createShipment.mockRejectedValueOnce(new Error('timeout'));

    const res = await request(app).post('/api/fedex/shipment').send({
      cotizacion_id: 1,
      direccion_destino: direccionValida,
      peso: 10,
      dimensiones: dimensionesValidas,
    });

    expect(res.status).toBe(502);
  });
});
