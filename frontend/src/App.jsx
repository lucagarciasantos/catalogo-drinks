import { useContext, useState } from 'react';
import { AuthContext } from './contexts/AuthContext';
import { DrinkContext } from './contexts/DrinkContext';
import { Login } from './components/Login';
import { SearchBar } from './components/SearchBar';
import { DrinkList } from './components/DrinkList';
import { DrinkForm } from './components/DrinkForm';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Snackbar,
  Alert,
} from '@mui/material';

// Vista principal (autenticada): cabecalho, busca, botao de adicionar, lista
// e o aviso de eventos em tempo real (Snackbar).
function CatalogView() {
  const { user, logout } = useContext(AuthContext);
  const { notice, setNotice } = useContext(DrinkContext);
  const [creating, setCreating] = useState(false);

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            🍹 Catalogo de Drinks
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            Ola, {user.username}
          </Typography>
          <Button color="inherit" onClick={logout}>
            Sair
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <SearchBar />
          <Button variant="contained" color="success" onClick={() => setCreating(true)}>
            + Adicionar Drink
          </Button>
        </Box>

        <DrinkList />
      </Container>

      {/* Formulario de criacao */}
      <DrinkForm open={creating} onClose={() => setCreating(false)} drink={null} />

      {/* Aviso de atualizacao em tempo real (RF6) */}
      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={4000}
        onClose={() => setNotice('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" onClose={() => setNotice('')}>
          {notice}
        </Alert>
      </Snackbar>
    </>
  );
}

function App() {
  const { user } = useContext(AuthContext);
  // Sem usuario logado -> tela de login (RF1 protege RF2-RF5).
  return user ? <CatalogView /> : <Login />;
}

export default App;
