import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ToastProvider from './context/ToastProvider.jsx'

const strictModeEnabled = String(import.meta.env.VITE_STRICT_MODE || 'true').toLowerCase() !== 'false'

createRoot(document.getElementById('root')).render(
  strictModeEnabled ? (
    <StrictMode>
      <ToastProvider>
        <App />
      </ToastProvider>
    </StrictMode>
  ) : (
    <ToastProvider>
      <App />
    </ToastProvider>
  ),
)
