import { useState, useContext, useRef, useEffect } from 'react';
import { DrinkContext } from '../contexts/DrinkContext';
import { TextField, Button, Box } from '@mui/material';

// Busca os drinks por nome no resource-service (RF2). O campo vazio lista todos.
export function SearchBar() {
  const { search } = useContext(DrinkContext);
  const [term, setTerm] = useState('');

  const inputRef = useRef(null);
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    search(term.trim());
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: 'flex', gap: 1, alignItems: 'center' }}
    >
      <TextField
        inputRef={inputRef}
        label="Buscar por nome (ex: Mojito)"
        variant="outlined"
        size="small"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        sx={{ minWidth: 280 }}
      />
      <Button variant="contained" type="submit">
        Buscar
      </Button>
    </Box>
  );
}
