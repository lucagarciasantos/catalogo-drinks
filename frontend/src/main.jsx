import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import CssBaseline from '@mui/material/CssBaseline'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { DrinkProvider } from './contexts/DrinkContext.jsx'

// AuthProvider envolve o DrinkProvider: o token vem da autenticacao e e usado
// pelo DrinkProvider para chamar o resource-service e abrir o WebSocket.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* CssBaseline aplica o reset de CSS do MUI (remove margem do body etc.). */}
    <CssBaseline />
    <AuthProvider>
      <DrinkProvider>
        <App />
      </DrinkProvider>
    </AuthProvider>
  </React.StrictMode>,
)
