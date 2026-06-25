// Cache em memoria com TTL, usado nas buscas (RF2). E invalidado por completo
// a cada escrita (create/update/delete), garantindo consistencia simples.
const store = new Map();
const TTL_MS = Number(process.env.CACHE_TTL_MS) || 30000;

function get(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

function set(key, value) {
  store.set(key, { value, expires: Date.now() + TTL_MS });
}

// Invalida todo o cache (chamado apos qualquer escrita).
function clear() {
  store.clear();
}

module.exports = { get, set, clear, TTL_MS };
