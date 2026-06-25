const db = require('../config/db');

// Lista de revogacao persistida em SQLite (fonte de verdade do auth-service).
const stmtRevoke = db.prepare(
  'INSERT OR IGNORE INTO revoked_tokens (jti, expires_at) VALUES (?, ?)'
);
const stmtIsRevoked = db.prepare('SELECT 1 FROM revoked_tokens WHERE jti = ?');
const stmtPurge = db.prepare('DELETE FROM revoked_tokens WHERE expires_at < ?');

function revoke(jti, expiresAt) {
  stmtRevoke.run(jti, expiresAt);
}

function isRevoked(jti) {
  return !!stmtIsRevoked.get(jti);
}

// Remove tokens ja expirados (nao precisam mais ficar na lista).
function purgeExpired() {
  stmtPurge.run(Math.floor(Date.now() / 1000));
}

module.exports = { revoke, isRevoked, purgeExpired };
