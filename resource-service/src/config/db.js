const path = require('path');
const Database = require('better-sqlite3');
const logger = require('./logger');

// Arquivo SQLite PROPRIO deste servico. So guarda drinks; o resource-service
// nunca acessa o banco de usuarios do auth-service.
const DB_FILE =
  process.env.DB_FILE || path.join(__dirname, '..', '..', 'resource.sqlite');

const db = new Database(DB_FILE);

// "Pool"/tuning para SQLite (banco embarcado, conexao unica):
// WAL melhora concorrencia e busy_timeout evita falhas SQLITE_BUSY.
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS drinks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    instructions TEXT,
    ingredients TEXT,
    image_url TEXT,
    user_id INTEGER NOT NULL,        -- dono do registro (sub do JWT)
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT
  );
`);

// Seed de drinks (equivalentes aos da TheCocktailDB) para a lista nao comecar
// vazia. Pertencem ao usuario 1 (alice) -> util para demonstrar o 403 quando
// outro usuario tenta editar/excluir.
function seedDrinks() {
  const count = db.prepare('SELECT COUNT(*) AS n FROM drinks').get().n;
  if (count > 0) return;

  const insert = db.prepare(`
    INSERT INTO drinks (name, category, instructions, ingredients, image_url, user_id)
    VALUES (@name, @category, @instructions, @ingredients, @image_url, 1)
  `);

  const seeds = [
    {
      name: 'Margarita',
      category: 'Cocktail',
      instructions:
        'Esfregue a borda do copo com limao, mergulhe no sal e bata os demais ingredientes com gelo.',
      ingredients: 'Tequila, Triple sec, Suco de limao, Sal',
      image_url:
        'https://www.thecocktaildb.com/images/media/drink/5noda61589575158.jpg',
    },
    {
      name: 'Mojito',
      category: 'Cocktail',
      instructions:
        'Macere a hortela com acucar e limao, adicione rum e gelo, complete com agua com gas.',
      ingredients: 'Rum branco, Hortela, Acucar, Limao, Agua com gas',
      image_url:
        'https://www.thecocktaildb.com/images/media/drink/metwgh1606770327.jpg',
    },
    {
      name: 'Negroni',
      category: 'Cocktail',
      instructions: 'Misture os ingredientes com gelo e sirva com uma casca de laranja.',
      ingredients: 'Gin, Campari, Vermute tinto',
      image_url:
        'https://www.thecocktaildb.com/images/media/drink/qgdu971561574065.jpg',
    },
    {
      name: 'Daiquiri',
      category: 'Cocktail',
      instructions: 'Bata todos os ingredientes com gelo e coe para uma taca gelada.',
      ingredients: 'Rum branco, Suco de limao, Xarope de acucar',
      image_url:
        'https://www.thecocktaildb.com/images/media/drink/mrz9091589574515.jpg',
    },
  ];

  const tx = db.transaction(() => seeds.forEach((d) => insert.run(d)));
  tx();
  logger.info('Seed de drinks criado', { total: seeds.length });
}

logger.info('Banco SQLite pronto', { file: DB_FILE });

module.exports = { db, seedDrinks };
