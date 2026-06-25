const { db } = require('../config/db');

// Todas as queries sao parametrizadas (prepared statements) -> sem concatenar
// SQL, protegendo contra SQL injection.
const stmtAll = db.prepare('SELECT * FROM drinks ORDER BY datetime(created_at) DESC');
const stmtSearch = db.prepare(
  'SELECT * FROM drinks WHERE name LIKE ? ORDER BY datetime(created_at) DESC'
);
const stmtById = db.prepare('SELECT * FROM drinks WHERE id = ?');
const stmtInsert = db.prepare(`
  INSERT INTO drinks (name, category, instructions, ingredients, image_url, user_id)
  VALUES (@name, @category, @instructions, @ingredients, @image_url, @user_id)
`);
const stmtUpdate = db.prepare(`
  UPDATE drinks
  SET name = @name, category = @category, instructions = @instructions,
      ingredients = @ingredients, image_url = @image_url, updated_at = datetime('now')
  WHERE id = @id
`);
const stmtDelete = db.prepare('DELETE FROM drinks WHERE id = ?');

function list(search) {
  if (search) return stmtSearch.all(`%${search}%`);
  return stmtAll.all();
}

function getById(id) {
  return stmtById.get(id);
}

function create(drink) {
  const info = stmtInsert.run(drink);
  return getById(info.lastInsertRowid);
}

function update(drink) {
  stmtUpdate.run(drink);
  return getById(drink.id);
}

function remove(id) {
  stmtDelete.run(id);
}

module.exports = { list, getById, create, update, remove };
