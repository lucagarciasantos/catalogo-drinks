const jwt = require('jsonwebtoken');
const { client: redis } = require('./redis');
const logger = require('./logger');

// Segredo compartilhado com o auth-service. Permite validar o JWT LOCALMENTE,
// sem chamar o auth-service a cada request.
const SECRET = process.env.JWT_SECRET || 'dev-secret-NAO-usar-em-producao';

function getBearer(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

// Middleware: valida assinatura/expiracao e checa revogacao (logout) via Redis.
async function authenticate(req, res, next) {
  const token = getBearer(req);
  if (!token) {
    logger.warn('Acesso negado: token ausente', { path: req.path });
    return res.status(401).json({ error: 'Token de autenticacao ausente.' });
  }

  let payload;
  try {
    payload = jwt.verify(token, SECRET);
  } catch {
    logger.warn('Acesso negado: token invalido ou expirado', { path: req.path });
    return res.status(401).json({ error: 'Token invalido ou expirado.' });
  }

  // Revogacao via Redis (espelhada no logout). Degrada se o Redis estiver fora.
  if (redis.isReady) {
    try {
      const revoked = await redis.get(`revoked:${payload.jti}`);
      if (revoked) {
        logger.warn('Acesso negado: token revogado', { userId: payload.sub });
        return res
          .status(401)
          .json({ error: 'Token revogado. Faca login novamente.' });
      }
    } catch (e) {
      logger.warn('Falha ao checar revogacao no Redis', { error: e.message });
    }
  }

  req.user = { id: payload.sub, username: payload.username };
  next();
}

module.exports = authenticate;
