require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');

const logger = require('./src/config/logger');
const authRoutes = require('./src/routes/auth');
const userModel = require('./src/models/userModel');
const tokenModel = require('./src/models/tokenModel');

const app = express();
const PORT = process.env.AUTH_PORT || 3001;

app.use(compression()); // compressao das respostas HTTP (RNF de performance)
app.use(cors());
app.use(express.json());
// morgan: cada linha de acesso identifica o servico de origem.
app.use(morgan('[auth-service] :method :url :status - :response-time ms'));

app.get('/health', (req, res) =>
  res.json({ service: 'auth-service', status: 'ok' })
);

app.use('/', authRoutes);

// Handler de erro central -> evita vazar stack trace ao cliente.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error('Erro nao tratado', { path: req.path, error: err.message });
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

// Inicializacao: cria usuarios de teste e limpa tokens expirados.
userModel.seed();
tokenModel.purgeExpired();
setInterval(() => tokenModel.purgeExpired(), 60 * 60 * 1000).unref();

// Em PRODUCAO este servico ficaria atras de HTTPS (TLS terminado por um proxy
// reverso como Nginx, ou com certificado proprio). Em desenvolvimento local
// usamos HTTP simples para facilitar a execucao.
app.listen(PORT, () => logger.info(`auth-service ouvindo na porta ${PORT}`));
