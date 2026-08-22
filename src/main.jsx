import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.jsx'
import { CommerceProvider } from './context/CommerceContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <CommerceProvider>
        <App />
      </CommerceProvider>
    </HelmetProvider>
  </StrictMode>,
)
