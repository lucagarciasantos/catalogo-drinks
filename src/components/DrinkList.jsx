import { useContext } from 'react';
import { DrinkContext } from '../contexts/DrinkContext';
import { Grid, Card, CardMedia, CardContent, Typography, Box } from '@mui/material';

export function DrinkList() {
  const { drinks } = useContext(DrinkContext);

  //se a lista estiver vazia, não renderiza nada
  if (!drinks || drinks.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 5, mb: 5 }}>
      <Grid container spacing={3}>
        {/*percorre o array de drinks do context e cria um card para cada um*/}
        {drinks.map((drink) => (
          <Grid item xs={12} sm={6} md={4} key={drink.idDrink}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="250"
                image={drink.strDrinkThumb}
                alt={drink.strDrink}
              />
              <CardContent>
                <Typography gutterBottom variant="h6" component="div">
                  {drink.strDrink}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}