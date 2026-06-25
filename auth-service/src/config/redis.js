const { createClient } = require('redis');
const logger = require('./logger');

// Redis e usado aqui apenas para ESPELHAR tokens revogados, de forma que o
// resource-service consiga rejeitar um token apos o logout sem consultar este
// servico a cada request. Se o Redis estiver fora, o servico degrada com aviso.
const url = process.env.REDIS_URL || 'redis://localhost:6379';

const client = createClient({
  url,
  socket: {
    // Backoff crescente, com teto, para nao tentar reconectar em loop apertado.
    reconnectStrategy: (retries) => Math.min(1000 + retries * 500, 10000),
  },
});

// Loga a indisponibilidade apenas uma vez por "queda", evitando poluir o log.
let warned = false;
client.on('error', (err) => {
  if (!warned) {
    logger.warn('Redis indisponivel (seguindo em modo degradado)', {
      error: err.message || 'connection refused',
    });
    warned = true;
  }
});
client.on('ready', () => {
  warned = false;
  logger.info('Conectado ao Redis', { url });
});

(async () => {
  try {
    await client.connect();
  } catch (e) {
    // O reconnectStrategy continuara tentando em segundo plano.
    logger.warn('Nao foi possivel conectar ao Redis no startup', {
      error: e.message,
    });
  }
})();

module.exports = client;
