import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AgentProvider } from './services/AgentContext.jsx';
import { Web3AuthProvider } from "@web3auth/modal/react";
import web3AuthContextConfig from "./web3authContext.jsx";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import App from './App.jsx'
import { ThemeProvider, CssBaseline  } from '@mui/material';
import theme from './theme';
import { Buffer } from 'buffer';

if(!window.Buffer) window.Buffer = Buffer

/**
 * Application Entry Point 
 * 
 * Renders the React app into the #root DOM element
 * Wraps the app with global providers: 
 * 
 * - Web3AuthProvider - configures Web3Auth (wallet connection)
 * - LocalizationProvider - Provides date handling with Day.js
 * - ThemeProvider - Applies custom MUI theme across the app 
 * - CssBaseline - Resets/normalizes CSS for consistent styling
 * - AgentProvider - Custom context for Veramo agent, DID, identity state. 
 * 
 * Inside these providers, the main App component handles routing & layout. 
 * 
 * Strictmode disabled because it interferes with the Carousel component. 
 */

createRoot(document.getElementById('root')).render(
  // <StrictMode>
    <Web3AuthProvider config={web3AuthContextConfig}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AgentProvider>
            <App />
          </AgentProvider>
        </ThemeProvider>
      </LocalizationProvider>
    </Web3AuthProvider>
  // </StrictMode>
);
