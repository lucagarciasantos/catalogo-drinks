const { WebSocketServer } = require('ws');
const logger = require('../config/logger');

// Configura o servidor WebSocket sobre o mesmo servidor HTTP (mesma porta) e
// devolve uma funcao broadcast() para retransmitir mensagens a todos os clientes.
function setupWebSocket(httpServer) {
  const wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws) => {
    logger.info('Cliente WebSocket conectado', { total: wss.clients.size });
    ws.send(
      JSON.stringify({
        evento: 'conexao.estabelecida',
        mensagem: 'Conectado ao notification-service',
      })
    );
    ws.on('close', () =>
      logger.info('Cliente WebSocket desconectado', { total: wss.clients.size })
    );
    ws.on('error', (e) =>
      logger.warn('Erro na conexao WebSocket', { error: e.message })
    );
  });

  function broadcast(data) {
    const message = JSON.stringify(data);
    let enviados = 0;
    for (const client of wss.clients) {
      if (client.readyState === client.OPEN) {
        client.send(message);
        enviados += 1;
      }
    }
    logger.info('Notificacao retransmitida via WebSocket', { clientes: enviados });
  }

  return { wss, broadcast };
}

module.exports = setupWebSocket;
