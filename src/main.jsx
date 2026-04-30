import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
//import do provedor
import { DrinkProvider } from './contexts/DrinkContext.jsx' 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DrinkProvider>
      <App />
    </DrinkProvider>
  </React.StrictMode>,
)