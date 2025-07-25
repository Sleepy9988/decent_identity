import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AgentProvider } from './services/AgentContext.jsx';
import { Web3AuthProvider } from "@web3auth/modal/react";
import web3AuthContextConfig from "./web3authContext.jsx";
import App from './App.jsx'

import { ThemeProvider, CssBaseline  } from '@mui/material';
import theme from './theme';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Web3AuthProvider config={web3AuthContextConfig}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AgentProvider>
          <App />
        </AgentProvider>
      </ThemeProvider>
    </Web3AuthProvider>
  </StrictMode>
);
