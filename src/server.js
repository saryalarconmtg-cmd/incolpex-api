const express = require('express');
const cors = require('cors');
require('dotenv').config();

const cotizacionesRoutes = require('./modules/cotizaciones/cotizacion.routes');
const fedexRoutes = require('./modules/fedex/fedex.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Incolpex API funcionando' });
});

app.use('/api/cotizaciones', cotizacionesRoutes);
app.use('/api/fedex', fedexRoutes);

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
  });
}

module.exports = app;
