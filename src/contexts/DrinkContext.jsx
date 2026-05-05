import { createContext, useState } from 'react';

//cria o contexto
export const DrinkContext = createContext();

//cria o provedor
export function DrinkProvider({ children }) {
  const [drinks, setDrinks] = useState([]);
  const [errorApi, setErrorApi] = useState(null); //erro pós-envio

  //função ajax de busca
  const searchDrinks = async (ingredient) => {
    try {
      //limpa erros
      setErrorApi(null); 
      
      const response = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/filter.php?i=${ingredient}`);
      
      //trata retorno vazio da api
      const text = await response.text();
      if (!text) {
        setDrinks([]);
        setErrorApi("nenhum drink encontrado com esse ingrediente.");
        return;
      }

      const data = JSON.parse(text);
      
      if (data.drinks && Array.isArray(data.drinks)) {
        setDrinks(data.drinks);
      } else {
        setDrinks([]);
        setErrorApi("nenhum drink encontrado com esse ingrediente.");
      }
    } catch (err) {
      setDrinks([]);
      setErrorApi("erro ao conectar com a api.");
    }
  };

  return (
    <DrinkContext.Provider value={{ drinks, searchDrinks, errorApi, setErrorApi }}>
      {children}
    </DrinkContext.Provider>
  );
}