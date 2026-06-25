import {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { AuthContext } from './AuthContext';
import * as api from '../api';
import { WS_URL } from '../api';

// Estado dos drinks: agora vem do NOSSO backend (resource-service), nao mais da
// TheCocktailDB. Cuida da busca, do CRUD e da atualizacao em tempo real (WebSocket).
export const DrinkContext = createContext();

export function DrinkProvider({ children }) {
  const { token, logout } = useContext(AuthContext);

  const [drinks, setDrinks] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(''); // mensagem de evento em tempo real

  // termo de busca atual, em ref, para o WebSocket recarregar sem virar dependencia
  const searchRef = useRef('');

  const loadDrinks = useCallback(
    async (term = searchRef.current) => {
      if (!token) return;
      setLoading(true);
      setError('');
      try {
        const list = await api.fetchDrinks(token, term);
        setDrinks(list);
      } catch (e) {
        setError(e.message);
        // Token invalido/expirado/revogado -> derruba a sessao (volta ao login).
        if (e.status === 401) logout();
      } finally {
        setLoading(false);
      }
    },
    [token, logout]
  );

  // Carrega a lista assim que ha token (login).
  useEffect(() => {
    if (token) loadDrinks();
  }, [token, loadDrinks]);

  // WebSocket: ao receber qualquer evento de recurso, recarrega a lista.
  useEffect(() => {
    if (!token) return;

    const ws = new WebSocket(WS_URL);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.evento && msg.evento.startsWith('recurso.')) {
          const labels = {
            'recurso.criado': 'Novo drink adicionado',
            'recurso.atualizado': 'Um drink foi atualizado',
            'recurso.excluido': 'Um drink foi removido',
          };
          setNotice(
            `${labels[msg.evento] || 'Atualizacao'}${
              msg.autor ? ` por ${msg.autor}` : ''
            }`
          );
          loadDrinks(); // atualiza automaticamente, sem reload
        }
      } catch {
        /* ignora mensagens fora do formato */
      }
    };
    ws.onerror = () => {
      /* sem WebSocket a app ainda funciona, so perde o tempo real */
    };

    return () => ws.close();
  }, [token, loadDrinks]);

  const search = useCallback(
    (term) => {
      searchRef.current = term;
      loadDrinks(term);
    },
    [loadDrinks]
  );

  // Apos cada escrita, recarrega localmente (garante atualizacao mesmo sem o
  // caminho de tempo real). O WebSocket cuida dos OUTROS clientes conectados.
  const createDrink = useCallback(
    async (data) => {
      await api.createDrink(token, data);
      await loadDrinks();
    },
    [token, loadDrinks]
  );

  const updateDrink = useCallback(
    async (id, data) => {
      await api.updateDrink(token, id, data);
      await loadDrinks();
    },
    [token, loadDrinks]
  );

  const deleteDrink = useCallback(
    async (id) => {
      await api.deleteDrink(token, id);
      await loadDrinks();
    },
    [token, loadDrinks]
  );

  return (
    <DrinkContext.Provider
      value={{
        drinks,
        error,
        loading,
        notice,
        setNotice,
        search,
        loadDrinks,
        createDrink,
        updateDrink,
        deleteDrink,
      }}
    >
      {children}
    </DrinkContext.Provider>
  );
}
