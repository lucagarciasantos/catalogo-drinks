const { createClient } = require('redis');
const logger = require('./logger');

// O resource-service usa o Redis para:
//  1) PUBLICAR eventos a cada escrita (create/update/delete) -> fila Pub/Sub.
//  2) Checar tokens revogados (espelhados pelo auth-service) sem chamar o auth.
// Se o Redis estiver fora, o servico segue funcionando em modo degradado.
const url = process.env.REDIS_URL || 'redis://localhost:6379';

const client = createClient({
  url,
  socket: {
    reconnectStrategy: (retries) => Math.min(1000 + retries * 500, 10000),
  },
});

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
    logger.warn('Nao foi possivel conectar ao Redis no startup', {
      error: e.message,
    });
  }
})();

// Publica um evento na fila. Falhas nao derrubam a operacao principal.
async function publish(channel, payload) {
  if (!client.isReady) return;
  try {
    await client.publish(channel, JSON.stringify(payload));
    logger.info('Evento publicado', { channel });
  } catch (e) {
    logger.warn('Falha ao publicar evento', { channel, error: e.message });
  }
}

module.exports = { client, publish };
