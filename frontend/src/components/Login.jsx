import { useState, useContext, useRef, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
} from '@mui/material';

// Tela de login (RF1). Sem cadastro: usuarios de teste vem do seed do auth-service.
export function Login() {
  const { login, error } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const userRef = useRef(null);
  useEffect(() => {
    if (userRef.current) userRef.current.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await login(username.trim(), password);
    setSubmitting(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Card sx={{ width: 360, p: 2 }}>
        <CardContent>
          <Typography variant="h5" component="h1" gutterBottom align="center">
            🍹 Catalogo de Drinks
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" mb={2}>
            Entre para gerenciar os drinks
          </Typography>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <TextField
              inputRef={userRef}
              label="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
            />
            <TextField
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
            />

            {error && <Alert severity="error">{error}</Alert>}

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={submitting}
            >
              {submitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            align="center"
            mt={2}
          >
            Usuarios de teste: alice / bob — senha: senha123
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
