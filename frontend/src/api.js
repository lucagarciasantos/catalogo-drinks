// Centraliza as chamadas HTTP aos microsservicos e a URL do WebSocket.
// As bases vem de variaveis de ambiente do Vite (com fallback para localhost).
const AUTH_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:3001';
const RESOURCE_URL = import.meta.env.VITE_RESOURCE_URL || 'http://localhost:3002';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3003';

// Wrapper de fetch: extrai mensagens de erro do servidor e padroniza o
// tratamento de falhas entre os servicos. Erros carregam o status HTTP.
async function request(url, options = {}) {
  let res;
  try {
    res = await fetch(url, options);
  } catch {
    throw new Error('Nao foi possivel conectar ao servidor.');
  }

  let data = {};
  try {
    data = await res.json();
  } catch {
    // resposta sem corpo JSON -> mantem o objeto vazio
  }

  if (!res.ok) {
    const message =
      data.error ||
      (Array.isArray(data.errors) ? data.errors.join(' ') : null) ||
      `Erro ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return data;
}

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

// ---- auth-service ----
export function login(username, password) {
  return request(`${AUTH_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
}

export async function logout(token) {
  // Logout e best-effort: mesmo que falhe, o cliente descarta o token.
  try {
    await request(`${AUTH_URL}/logout`, {
      method: 'POST',
      headers: authHeaders(token),
    });
  } catch {
    /* ignora */
  }
}

// ---- resource-service ----
export async function fetchDrinks(token, search = '') {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  const data = await request(`${RESOURCE_URL}/drinks${query}`, {
    headers: authHeaders(token),
  });
  return data.drinks || [];
}

export async function createDrink(token, drink) {
  const data = await request(`${RESOURCE_URL}/drinks`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(drink),
  });
  return data.drink;
}

export async function updateDrink(token, id, drink) {
  const data = await request(`${RESOURCE_URL}/drinks/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(drink),
  });
  return data.drink;
}

export function deleteDrink(token, id) {
  return request(`${RESOURCE_URL}/drinks/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}
