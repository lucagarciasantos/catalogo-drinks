require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');

const logger = require('./src/config/logger');
const { seedDrinks } = require('./src/config/db');
const authenticate = require('./src/config/auth');
const drinksRoutes = require('./src/routes/drinks');

const app = express();
const PORT = process.env.RESOURCE_PORT || 3002;

app.use(compression()); // compressao das respostas HTTP
app.use(cors());
app.use(express.json());
app.use(morgan('[resource-service] :method :url :status - :response-time ms'));

app.get('/health', (req, res) =>
  res.json({ service: 'resource-service', status: 'ok' })
);

// Tudo em /drinks exige JWT valido (RF2-RF5).
app.use('/drinks', authenticate, drinksRoutes);

// Handler de erro central.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error('Erro nao tratado', { path: req.path, error: err.message });
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

seedDrinks();

app.listen(PORT, () => logger.info(`resource-service ouvindo na porta ${PORT}`));
