const fedexService = require('./fedex.service');
const fedexModel = require('./fedex.model');

function validarDireccion(direccion) {
  if (!direccion || typeof direccion !== 'object') {
    return ['direccion_destino debe ser un objeto con calle, ciudad, codigo_postal y pais'];
  }

  const { calle, ciudad, codigo_postal, pais } = direccion;
  const errores = [];

  if (!calle || typeof calle !== 'string') errores.push('calle es requerida');
  if (!ciudad || typeof ciudad !== 'string') errores.push('ciudad es requerida');
  if (!codigo_postal || !/^[A-Za-z0-9\- ]{3,10}$/.test(codigo_postal)) {
    errores.push('codigo_postal tiene un formato inválido');
  }
  if (!pais || !/^[A-Z]{2}$/.test(pais)) {
    errores.push('pais debe ser un código ISO de 2 letras mayúsculas (ej: CO, US)');
  }

  return errores;
}

function validarDimensiones(dimensiones) {
  if (!dimensiones || typeof dimensiones !== 'object') {
    return ['dimensiones debe ser un objeto con largo, ancho y alto'];
  }

  const { largo, ancho, alto } = dimensiones;
  const errores = [];

  [['largo', largo], ['ancho', ancho], ['alto', alto]].forEach(([nombre, valor]) => {
    if (typeof valor !== 'number' || Number.isNaN(valor) || valor <= 0) {
      errores.push(`${nombre} debe ser un número mayor a 0`);
    }
  });

  return errores;
}

async function crearShipment(req, res) {
  const { cotizacion_id, direccion_destino, peso, dimensiones } = req.body;

  if (cotizacion_id === undefined || !direccion_destino || peso === undefined || !dimensiones) {
    return res.status(400).json({
      error: 'Faltan campos requeridos: cotizacion_id, direccion_destino, peso, dimensiones',
    });
  }

  const erroresDireccion = validarDireccion(direccion_destino);
  if (erroresDireccion.length > 0) {
    return res.status(400).json({ error: 'Dirección de destino inválida', detalles: erroresDireccion });
  }

  if (typeof peso !== 'number' || Number.isNaN(peso) || peso <= 0) {
    return res.status(400).json({ error: 'peso debe ser un número mayor a 0' });
  }

  if (peso > fedexService.FEDEX_MAX_PESO_KG) {
    return res.status(422).json({
      error: `El peso (${peso}kg) excede el máximo permitido por FedEx (${fedexService.FEDEX_MAX_PESO_KG}kg)`,
    });
  }

  const erroresDimensiones = validarDimensiones(dimensiones);
  if (erroresDimensiones.length > 0) {
    return res.status(400).json({ error: 'Dimensiones inválidas', detalles: erroresDimensiones });
  }

  try {
    const { trackingNumber, etiquetaUrl } = await fedexService.createShipment(
      fedexService.ORIGEN_BODEGA_CHINA,
      direccion_destino,
      peso,
      dimensiones,
    );

    const shipment = await fedexModel.create({
      cotizacion_id,
      direccion_destino,
      peso,
      dimensiones,
      tracking_number: trackingNumber,
      etiqueta_url: etiquetaUrl,
    });

    return res.status(201).json(shipment);
  } catch (error) {
    return res.status(502).json({ error: 'Error al crear el envío en FedEx' });
  }
}

module.exports = { crearShipment, validarDireccion, validarDimensiones };
