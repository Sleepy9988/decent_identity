import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import { Web3AuthProvider } from "@web3auth/modal/react";
import web3AuthContextConfig from "./web3authContext";
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Web3AuthProvider config={web3AuthContextConfig}>
          <App />
    </Web3AuthProvider>
  </StrictMode>
);
