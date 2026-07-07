const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./modules/auth/auth.routes');
const cotizacionesRoutes = require('./modules/cotizaciones/cotizacion.routes');
const fedexRoutes = require('./modules/fedex/fedex.routes');
const whatsappRoutes = require('./modules/whatsapp/whatsapp.routes');
const xubioRoutes = require('./modules/xubio/xubio.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Incolpex API funcionando' });
});

app.use('/api/auth', authRoutes);
app.use('/api/cotizaciones', cotizacionesRoutes);
app.use('/api/fedex', fedexRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/xubio', xubioRoutes);
app.use('/api/dashboard', dashboardRoutes);

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
  });
}

module.exports = app;
