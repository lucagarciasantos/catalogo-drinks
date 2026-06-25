import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { DrinkProvider } from './contexts/DrinkContext.jsx'

// AuthProvider envolve o DrinkProvider: o token vem da autenticacao e e usado
// pelo DrinkProvider para chamar o resource-service e abrir o WebSocket.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <DrinkProvider>
        <App />
      </DrinkProvider>
    </AuthProvider>
  </React.StrictMode>,
)
