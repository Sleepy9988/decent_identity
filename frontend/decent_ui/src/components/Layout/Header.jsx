import React from 'react';
import AppBar from '@mui/material/AppBar';
import { Box, Typography, Toolbar, Link, Badge} from "@mui/material";
import { Link as RouterLink } from 'react-router-dom';
import { DisconnectWeb3AuthButton } from '../Buttons';

import NotificationsIcon from '@mui/icons-material/Notifications';

import { useAgent } from '../../services/AgentContext';

export default function Header({ loggedIn }) {
  const { notifications } = useAgent();
  
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
          <Box>
            <Badge color='primary' sx={{mr: 10}} badgeContent={notifications.length}>
              <NotificationsIcon fontSize="large" color='action' />
            </Badge>
            <DisconnectWeb3AuthButton />
          </Box>
        ) : null
        }
      </Toolbar>
    </AppBar>
  );
}