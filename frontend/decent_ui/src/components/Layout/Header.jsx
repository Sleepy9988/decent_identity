import React from 'react';
import AppBar from '@mui/material/AppBar';
import { Box, Typography, Toolbar, Link, Badge} from "@mui/material";
import { Link as RouterLink } from 'react-router-dom';
import { DisconnectWeb3AuthButton } from '../Buttons';

import NotificationPopover  from '../Misc/NotificationPopover';



export default function Header({ loggedIn }) {


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
        {loggedIn ? (
          <Box sx={{ display: 'flex', direction: 'row', justifyContent: 'space-between'}}>
            <NotificationPopover />
            <DisconnectWeb3AuthButton />
          </Box>
        ) : null
        }
      </Toolbar>
    </AppBar>
  );
}