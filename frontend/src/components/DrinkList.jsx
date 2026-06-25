import { useContext, useState } from 'react';
import { DrinkContext } from '../contexts/DrinkContext';
import { AuthContext } from '../contexts/AuthContext';
import { DrinkForm } from './DrinkForm';
import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';

// Imagem usada quando o drink nao tem URL de foto.
const FALLBACK_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250"><rect width="100%" height="100%" fill="#eceff1"/><text x="50%" y="50%" font-size="20" fill="#90a4ae" text-anchor="middle" dy=".3em">sem imagem</text></svg>'
  );

export function DrinkList() {
  const { drinks, loading, error, deleteDrink } = useContext(DrinkContext);
  const { user } = useContext(AuthContext);

  const [editing, setEditing] = useState(null); // drink em edicao
  const [confirm, setConfirm] = useState(null); // drink a excluir (confirmacao)
  const [removing, setRemoving] = useState(false);

  const handleConfirmDelete = async () => {
    setRemoving(true);
    try {
      await deleteDrink(confirm.id);
    } catch {
      /* o erro ja e logado no servidor; a lista permanece */
    } finally {
      setRemoving(false);
      setConfirm(null);
    }
  };

  if (loading && drinks.length === 0) {
    return (
      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" sx={{ mt: 4 }}>
        {error}
      </Typography>
    );
  }

  if (drinks.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ mt: 4 }}>
        Nenhum drink encontrado. Que tal adicionar o primeiro?
      </Typography>
    );
  }

  return (
    <Box sx={{ mt: 4, mb: 5 }}>
      <Grid container spacing={3}>
        {drinks.map((drink) => {
          const isOwner = user && drink.user_id === user.id;
          return (
            <Grid item xs={12} sm={6} md={4} key={drink.id}>
              <Card
                sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <CardMedia
                  component="img"
                  height="220"
                  image={drink.image_url || FALLBACK_IMG}
                  alt={drink.name}
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_IMG;
                  }}
                />
                <CardContent sx={{ flexGrow: 1, textAlign: 'left' }}>
                  <Typography gutterBottom variant="h6" component="div">
                    {drink.name}
                  </Typography>
                  {drink.category && (
                    <Chip label={drink.category} size="small" sx={{ mb: 1 }} />
                  )}
                  {drink.ingredients && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Ingredientes:</strong> {drink.ingredients}
                    </Typography>
                  )}
                  {drink.instructions && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {drink.instructions}
                    </Typography>
                  )}
                </CardContent>

                {/* Editar/Excluir so aparecem para o dono do registro. */}
                {isOwner && (
                  <CardActions>
                    <Button size="small" onClick={() => setEditing(drink)}>
                      Editar
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => setConfirm(drink)}
                    >
                      Excluir
                    </Button>
                  </CardActions>
                )}
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Dialog de edicao */}
      <DrinkForm
        open={Boolean(editing)}
        drink={editing}
        onClose={() => setEditing(null)}
      />

      {/* Confirmacao antes de excluir (RF5) */}
      <Dialog open={Boolean(confirm)} onClose={() => setConfirm(null)}>
        <DialogTitle>Excluir drink</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir &quot;{confirm?.name}&quot;? Essa acao
            nao pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)}>Cancelar</Button>
          <Button color="error" onClick={handleConfirmDelete} disabled={removing}>
            {removing ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
