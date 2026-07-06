const axios = require('axios');

const FEDEX_BASE_URL = process.env.FEDEX_BASE_URL || 'https://apis-sandbox.fedex.com';
const FEDEX_MAX_PESO_KG = 70;

// Dirección fija de la bodega de origen en China; ajustar cuando se defina la bodega real.
const ORIGEN_BODEGA_CHINA = {
  calle: 'Bodega Incolpex',
  ciudad: 'Shenzhen',
  codigo_postal: '518000',
  pais: 'CN',
};

let cachedToken = null;
let cachedTokenExpiresAt = 0;

function mapDireccion(direccion) {
  return {
    streetLines: [direccion.calle],
    city: direccion.ciudad,
    postalCode: direccion.codigo_postal,
    countryCode: direccion.pais,
  };
}

async function obtenerToken() {
  if (cachedToken && Date.now() < cachedTokenExpiresAt) {
    return cachedToken;
  }

  const { data } = await axios.post(
    `${FEDEX_BASE_URL}/oauth/token`,
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.FEDEX_API_KEY,
      client_secret: process.env.FEDEX_API_SECRET,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );

  cachedToken = data.access_token;
  cachedTokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

async function createShipment(origen, destino, peso, dimensiones) {
  const token = await obtenerToken();

  const { data } = await axios.post(
    `${FEDEX_BASE_URL}/ship/v1/shipments`,
    {
      requestedShipment: {
        shipper: { address: mapDireccion(origen) },
        recipients: [{ address: mapDireccion(destino) }],
        pickupType: 'DROPOFF_AT_FEDEX_LOCATION',
        packagingType: 'YOUR_PACKAGING',
        requestedPackageLineItems: [
          {
            weight: { units: 'KG', value: peso },
            dimensions: {
              length: dimensiones.largo,
              width: dimensiones.ancho,
              height: dimensiones.alto,
              units: 'CM',
            },
          },
        ],
      },
    },
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
  );

  const shipmentInfo = data.output.transactionShipments[0];
  const pieceResponse = shipmentInfo.pieceResponses[0];

  return {
    trackingNumber: pieceResponse.trackingNumber,
    // FedEx retorna la etiqueta como documento base64 (encodedLabel); se asume que un
    // paso posterior la sube a almacenamiento propio y expone la URL resultante aquí.
    etiquetaUrl: pieceResponse.packageDocuments?.[0]?.url || null,
  };
}

module.exports = { createShipment, FEDEX_MAX_PESO_KG, ORIGEN_BODEGA_CHINA };
