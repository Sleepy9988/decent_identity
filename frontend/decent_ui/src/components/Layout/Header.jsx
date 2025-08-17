import React from 'react';
import { useWeb3AuthConnect } from "@web3auth/modal/react";
import AppBar from '@mui/material/AppBar';
import { Box, Typography, Toolbar, Link} from "@mui/material";
import { Link as RouterLink } from 'react-router-dom';
import { DisconnectWeb3AuthButton } from '../Buttons';

export default function Header() {
  const { isConnected } = useWeb3AuthConnect();
  return (
    <AppBar position='fixed' sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: '#15222e', py:2 }}>
      <Toolbar >
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Link component={RouterLink} to="/" underline="none" color="inherit" sx={{ display: 'flex', alignItems: 'center' }}>
              <img src='/assets/logo.png' alt="DIDHub Logo" style={{ height: 60, marginRight: 12 }} />
              <Typography variant="h4" noWrap component="div">
                DIDHub
              </Typography>
            </Link>
        </Box>
        
        {isConnected && <DisconnectWeb3AuthButton />}
      </Toolbar>
    </AppBar>
  );
}