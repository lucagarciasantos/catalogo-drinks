const express = require('express');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');

const userModel = require('../models/userModel');
const tokenModel = require('../models/tokenModel');
const jwtConfig = require('../config/jwt');
const redis = require('../config/redis');
const logger = require('../config/logger');

// Controladores ficam direto neste arquivo de rota (sem pasta controllers/).
const router = express.Router();

// Rate limiting nas tentativas de login (RNF de seguranca - forca bruta).
// skipSuccessfulRequests: apenas logins que FALHAM contam para o limite, entao
// um login correto nunca contribui para o bloqueio (UX amigavel na demo).
const loginLimiter = rateLimit({
  windowMs: Number(process.env.LOGIN_RATE_WINDOW_MS) || 15 * 60 * 1000,
  limit: Number(process.env.LOGIN_RATE_MAX) || 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Tente novamente mais tarde.' },
});

function cleanString(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function getBearer(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

// POST /login -> valida credenciais e emite JWT.
router.post('/login', loginLimiter, (req, res) => {
  const username = cleanString(req.body && req.body.username);
  const password =
    req.body && typeof req.body.password === 'string' ? req.body.password : '';

  if (!username || !password) {
    logger.warn('Login falhou: campos obrigatorios ausentes', { username });
    return res
      .status(400)
      .json({ error: 'username e password sao obrigatorios.' });
  }

  const user = userModel.getByUsername(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    logger.warn('Login falhou: credenciais invalidas', { username });
    return res.status(401).json({ error: 'Credenciais invalidas.' });
  }

  const { token } = jwtConfig.sign(user);
  logger.info('Login bem-sucedido', { userId: user.id, username: user.username });
  return res.json({
    token,
    user: { id: user.id, username: user.username },
  });
});

// POST /logout -> invalida o token atual (revogacao).
router.post('/logout', async (req, res) => {
  const token = getBearer(req);
  if (!token) return res.status(400).json({ error: 'Token ausente.' });

  let payload;
  try {
    payload = jwtConfig.verify(token);
  } catch {
    return res.status(401).json({ error: 'Token invalido ou expirado.' });
  }

  // 1) Persiste a revogacao no SQLite (fonte de verdade).
  tokenModel.revoke(payload.jti, payload.exp);

  // 2) Espelha no Redis com TTL = tempo restante do token, para que o
  //    resource-service rejeite o token sem consultar este servico.
  const ttl = payload.exp - Math.floor(Date.now() / 1000);
  if (ttl > 0 && redis.isReady) {
    try {
      await redis.set(`revoked:${payload.jti}`, '1', { EX: ttl });
    } catch (e) {
      logger.warn('Falha ao espelhar revogacao no Redis', { error: e.message });
    }
  }

  logger.info('Logout: token revogado', { userId: payload.sub, jti: payload.jti });
  return res.json({ message: 'Logout realizado. Token invalidado.' });
});

// GET /verify -> valida assinatura + expiracao + lista de revogacao.
// Util para depuracao e para clientes que queiram checar o token.
router.get('/verify', (req, res) => {
  const token = getBearer(req);
  if (!token) return res.status(401).json({ valid: false });

  try {
    const payload = jwtConfig.verify(token);
    if (tokenModel.isRevoked(payload.jti)) {
      return res.status(401).json({ valid: false, reason: 'token revogado' });
    }
    return res.json({
      valid: true,
      user: { id: payload.sub, username: payload.username },
    });
  } catch {
    return res.status(401).json({ valid: false });
  }
});

module.exports = router;
