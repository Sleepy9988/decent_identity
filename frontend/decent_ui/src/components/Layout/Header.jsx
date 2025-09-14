import React from 'react';
import AppBar from '@mui/material/AppBar';
import { Box, Typography, Toolbar, Link } from "@mui/material";
import { Link as RouterLink } from 'react-router-dom';
import { DisconnectWeb3AuthButton } from '../Buttons';
import NotificationPopover  from '../Misc/NotificationPopover';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';

/**
 * Application top navigation bar.
 * - Displays brand logo + app name (links to "/")
 * - If loggedIn is true: shows Notification popover and Disconnect button
 * 
 * Props:
 * - loggedIn: boolean, whether to show user controls
 */

export default function Header({ loggedIn, onMenuClick }) {
  return (
    <AppBar position='fixed' sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: '#15222e', py:2 }}>
      <Toolbar>
        <IconButton
          onClick={onMenuClick}
          edge="start"
          color='inherit'
          sx={{ mr: 1.5, display: { md: 'none' } }}
          aria-label='open navigation'
        >
          <MenuIcon />
        </IconButton>
        {/* Logo + brand name */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Link component={RouterLink} to="/" underline="none" color="inherit" sx={{ display: 'flex', alignItems: 'center' }}>
            <Box component="img"
              src='/assets/logo.png' 
              alt="DIDHub Logo" 
              sx={{ height: { xs: 40, sm: 50, md: 60 }, mr: { xs: 1, sm: 1.5 } }} />
              <Typography noWrap component="div" sx={{ typography: { xs: 'h6', sm: 'h5', md: 'h4' } }}>
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