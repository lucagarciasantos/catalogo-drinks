const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// O segredo e compartilhado via variavel de ambiente com o resource-service,
// para que ele valide o JWT localmente sem precisar chamar o auth-service.
const SECRET = process.env.JWT_SECRET || 'dev-secret-NAO-usar-em-producao';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// Assina um token com jti (id unico) para permitir revogacao no logout.
function sign(user) {
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    { sub: user.id, username: user.username },
    SECRET,
    { expiresIn: EXPIRES_IN, jwtid: jti }
  );
  const { exp } = jwt.decode(token);
  return { token, jti, exp };
}

// Valida assinatura e expiracao. Lanca excecao se invalido.
function verify(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { sign, verify, SECRET };
