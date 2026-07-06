const axios = require('axios');

const WHATSAPP_BASE_URL = process.env.WHATSAPP_BASE_URL || 'https://graph.facebook.com/v20.0';

async function sendMessage(numero_telefono, mensaje, tipo = 'generico') {
  const url = `${WHATSAPP_BASE_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  try {
    const { data } = await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        to: numero_telefono.replace('+', ''),
        type: 'text',
        text: { body: mensaje },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const messageId = data.messages?.[0]?.id || null;
    console.log(`[whatsapp] envío OK tipo=${tipo} telefono=${numero_telefono} messageId=${messageId}`);
    return { messageId };
  } catch (error) {
    console.error(`[whatsapp] envío FALLIDO tipo=${tipo} telefono=${numero_telefono} error=${error.message}`);
    throw error;
  }
}

module.exports = { sendMessage };
