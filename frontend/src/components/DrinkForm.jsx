import { useState, useContext, useEffect } from 'react';
import { DrinkContext } from '../contexts/DrinkContext';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Box,
} from '@mui/material';

const EMPTY = {
  name: '',
  category: '',
  ingredients: '',
  instructions: '',
  image_url: '',
};

// Formulario reutilizavel para criar (RF3) e editar (RF4) um drink.
// Quando `drink` e passado, esta em modo edicao.
export function DrinkForm({ open, onClose, drink }) {
  const { createDrink, updateDrink } = useContext(DrinkContext);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(drink);

  // Preenche o formulario ao abrir (com o drink em edicao ou em branco).
  useEffect(() => {
    if (open) {
      setForm(
        drink
          ? {
              name: drink.name || '',
              category: drink.category || '',
              ingredients: drink.ingredients || '',
              instructions: drink.instructions || '',
              image_url: drink.image_url || '',
            }
          : EMPTY
      );
      setError('');
    }
  }, [open, drink]);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('O nome do drink e obrigatorio.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (isEdit) await updateDrink(drink.id, form);
      else await createDrink(form);
      onClose();
    } catch (err) {
      // Mostra a mensagem de erro vinda do servidor (validacao/permissao/etc.).
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle>{isEdit ? 'Editar drink' : 'Novo drink'}</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}
        >
          <TextField
            label="Nome *"
            value={form.name}
            onChange={handleChange('name')}
            autoFocus
            fullWidth
          />
          <TextField
            label="Categoria"
            value={form.category}
            onChange={handleChange('category')}
            fullWidth
          />
          <TextField
            label="Ingredientes (separe por virgula)"
            value={form.ingredients}
            onChange={handleChange('ingredients')}
            fullWidth
          />
          <TextField
            label="Modo de preparo"
            value={form.instructions}
            onChange={handleChange('instructions')}
            multiline
            minRows={3}
            fullWidth
          />
          <TextField
            label="URL da imagem"
            value={form.image_url}
            onChange={handleChange('image_url')}
            placeholder="https://..."
            fullWidth
          />
          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
