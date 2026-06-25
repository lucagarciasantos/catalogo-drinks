require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');

const logger = require('./src/config/logger');
const healthRoutes = require('./src/routes/health');
const setupWebSocket = require('./src/routes/websocket');
const { startSubscriber } = require('./src/models/subscriber');

const app = express();
const PORT = process.env.NOTIFICATION_PORT || 3003;

app.use(compression());
app.use(cors());
app.use(morgan('[notification-service] :method :url :status - :response-time ms'));
app.use('/', healthRoutes);

// WebSocket compartilha o mesmo servidor HTTP (mesma porta).
const server = http.createServer(app);
const { broadcast } = setupWebSocket(server);

// Consome a fila Redis e retransmite cada evento para todos os clientes WebSocket.
startSubscriber((channel, payload) => broadcast(payload));

// Em PRODUCAO o WebSocket usaria WSS (TLS) atras de HTTPS; em desenvolvimento
// local usamos ws:// simples.
server.listen(PORT, () =>
  logger.info(`notification-service ouvindo na porta ${PORT} (HTTP + WebSocket)`)
);
