const bcrypt = require('bcryptjs');
const db = require('../config/db');
const logger = require('../config/logger');

// Queries parametrizadas (prepared statements) -> sem concatenar SQL,
// protegendo contra SQL injection.
const stmtByUsername = db.prepare('SELECT * FROM users WHERE username = ?');
const stmtCount = db.prepare('SELECT COUNT(*) AS n FROM users');
const stmtInsert = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');

function getByUsername(username) {
  return stmtByUsername.get(username);
}

// Popula o banco com usuarios de teste (a aplicacao nao tem cadastro).
// Senhas sao gravadas com hash bcrypt, nunca em texto puro.
function seed() {
  if (stmtCount.get().n > 0) return;

  const testUsers = [
    { username: 'alice', password: 'senha123' },
    { username: 'bob', password: 'senha123' },
  ];

  const tx = db.transaction(() => {
    for (const u of testUsers) {
      stmtInsert.run(u.username, bcrypt.hashSync(u.password, 10));
    }
  });
  tx();

  logger.info('Seed de usuarios de teste criado', {
    users: testUsers.map((u) => u.username),
  });
}

module.exports = { getByUsername, seed };
