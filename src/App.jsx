import { SearchBar } from './components/SearchBar';
import { DrinkList } from './components/DrinkList';
import { Container, Typography } from '@mui/material';

function App() {
  return (
    <Container maxWidth="md" sx={{ textAlign: 'center', mt: 5 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Catálogo de Drinks
      </Typography>
      
      <SearchBar />
      <DrinkList />
      
    </Container>
  )
}

export default App;