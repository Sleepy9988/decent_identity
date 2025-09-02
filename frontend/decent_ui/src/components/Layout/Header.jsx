import React from 'react';
import AppBar from '@mui/material/AppBar';
import { Box, Typography, Toolbar, Link } from "@mui/material";
import { Link as RouterLink } from 'react-router-dom';
import { DisconnectWeb3AuthButton } from '../Buttons';
import NotificationPopover  from '../Misc/NotificationPopover';

/**
 * Application top navigation bar.
 * - Displays brand logo + app name (links to "/")
 * - If loggedIn is true: shows Notification popover and Disconnect button
 * 
 * Props:
 * - loggedIn: boolean, whether to show user controls
 */

export default function Header({ loggedIn }) {
  return (
    <AppBar position='fixed' sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: '#15222e', py:2 }}>
      <Toolbar>
        {/* Logo + brand name */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Link component={RouterLink} to="/" underline="none" color="inherit" sx={{ display: 'flex', alignItems: 'center' }}>
              <img src='/assets/logo.png' alt="DIDHub Logo" style={{ height: 60, marginRight: 12 }} />
              <Typography variant="h4" noWrap component="div">
                DIDHub
              </Typography>
            </Link>
        </Box>
        {/* User controls (only if logged in) */}
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