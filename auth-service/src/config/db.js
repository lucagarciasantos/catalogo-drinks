const path = require('path');
const Database = require('better-sqlite3');
const logger = require('./logger');

// Cada servico tem seu PROPRIO arquivo SQLite. Nunca compartilhar tabelas
// entre servicos -> aqui ficam apenas usuarios e tokens revogados.
const DB_FILE = process.env.DB_FILE || path.join(__dirname, '..', '..', 'auth.sqlite');

const db = new Database(DB_FILE);

// "Pool"/tuning de conexao para SQLite (banco embarcado, conexao unica):
// - WAL: leituras e escritas concorrentes sem travar.
// - busy_timeout: aguarda em vez de falhar com SQLITE_BUSY sob concorrencia.
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS revoked_tokens (
    jti TEXT PRIMARY KEY,
    expires_at INTEGER NOT NULL,
    revoked_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

logger.info('Banco SQLite pronto', { file: DB_FILE });

module.exports = db;
