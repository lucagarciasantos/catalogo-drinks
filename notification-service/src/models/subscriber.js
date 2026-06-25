const { createClient } = require('redis');
const logger = require('../config/logger');

// Canais publicados pelo resource-service a cada escrita.
const CHANNELS = ['recurso.criado', 'recurso.atualizado', 'recurso.excluido'];

// Consumidor da fila: inscreve-se nos canais Redis e chama onEvent(canal, payload)
// para cada mensagem recebida. O caller (server.js) usa isso para retransmitir
// via WebSocket.
async function startSubscriber(onEvent) {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  const sub = createClient({
    url,
    socket: {
      reconnectStrategy: (retries) => Math.min(1000 + retries * 500, 10000),
    },
  });

  let warned = false;
  let subscribed = false;

  sub.on('error', (err) => {
    if (!warned) {
      logger.warn('Redis indisponivel (aguardando reconexao)', {
        error: err.message || 'connection refused',
      });
      warned = true;
    }
  });

  // Quando (re)conecta, garante a inscricao nos canais uma unica vez.
  sub.on('ready', async () => {
    warned = false;
    if (subscribed) {
      logger.info('Reconectado ao Redis');
      return;
    }
    for (const channel of CHANNELS) {
      await sub.subscribe(channel, (message) => {
        let payload;
        try {
          payload = JSON.parse(message);
        } catch {
          payload = { raw: message };
        }
        logger.info('Evento recebido da fila', { channel });
        onEvent(channel, payload);
      });
    }
    subscribed = true;
    logger.info('Inscrito nos canais da fila', { channels: CHANNELS });
  });

  // Nao trava o boot se o Redis ainda nao estiver de pe; o reconnectStrategy tenta de novo.
  sub.connect().catch((e) =>
    logger.warn('Nao foi possivel conectar o subscriber no startup', {
      error: e.message,
    })
  );

  return sub;
}

module.exports = { startSubscriber, CHANNELS };
