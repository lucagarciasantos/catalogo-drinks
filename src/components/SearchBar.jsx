import { useState, useContext, useRef, useEffect } from 'react';
import { DrinkContext } from '../contexts/DrinkContext';
import { TextField, Button, Box, Typography } from '@mui/material';

export function SearchBar() {
  const { searchDrinks, errorApi } = useContext(DrinkContext);
  const [ingredient, setIngredient] = useState('');
  const [errorLocal, setErrorLocal] = useState('');
  
  //hook exigido no projeto
  const inputRef = useRef(null);

  //foco automático
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();

    //validação pré-envio
    if (!ingredient.trim()) {
      setErrorLocal('por favor, digite um ingrediente.');
      return;
    }

    setErrorLocal('');
    searchDrinks(ingredient);
  };

  return (
    <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', mt: 4 }}>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          inputRef={inputRef}
          label="ex: vodka, gin..."
          variant="outlined"
          value={ingredient}
          onChange={(e) => setIngredient(e.target.value)}
          error={!!errorLocal}
          helperText={errorLocal}
        />
        <Button variant="contained" type="submit" sx={{ height: '56px' }}>
          Buscar
        </Button>
      </Box>
      
      {/*erro da api*/}
      {errorApi && (
        <Typography color="error" variant="body2">
          {errorApi}
        </Typography>
      )}
    </Box>
  );
}