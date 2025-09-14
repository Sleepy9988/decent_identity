import * as React from 'react';
import { Box, Typography, Drawer, Toolbar, List, Divider, ListItem, ListItemButton, ListItemIcon, ListItemText} from "@mui/material";
import DashboardIcon from '@mui/icons-material/Dashboard';
import PermIdentityIcon from '@mui/icons-material/PermIdentity';
import InboxIcon from '@mui/icons-material/Inbox';
import { NavLink } from 'react-router-dom';
import { useWeb3AuthConnect } from "@web3auth/modal/react";
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

const drawerWidth = 320;

// Sidebar menu definition (text, icon, path)
const menuItems = [
  {text: 'Dashboard', icon: <DashboardIcon fontSize="large"/>, path: '/dashboard'},
  {text: 'Identities', icon: <PermIdentityIcon fontSize="large" />, path: '/identities' },
  {text: 'Requests', icon: <InboxIcon fontSize="large" />, path: '/requests'},
];


/**
 * SidebarLeft 
 * 
 * Persistent left-hand navigation drawer
 * - Displays app navigation links with active state highlighting 
 * - Shows connection info (connector name) at the bottom
 * - MUI Drawer with fixed width
 */

export default function SidebarLeft({ mobileOpen = false, onClose = () => {} }) {
  const { connectorName } = useWeb3AuthConnect();
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  
  const content = (
    <>
      <Toolbar />
      <Box
        sx={{ 
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          pt: 10
        }}
      >
        {/* Navigation links */}
        <Typography variant="h5" align='center' gutterBottom>
          Navigation
        </Typography>
        <List>
          {menuItems.map(({text, icon, path}) => (
            <ListItem key={text} disablePadding>
              <ListItemButton 
                component={NavLink} 
                to={path}
                sx={{
                  '&.active': {
                    backgroundColor: 'action.selected',
                    color: 'primary.main',
                    '& .MuiListItemIcon-root': {
                      color: 'primary.main',
                    },
                  },
                }}
              >
                <ListItemIcon>
                  {icon}
                </ListItemIcon>
                <ListItemText primary={text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        {/* Push footer to bottom */}
        <Box sx={{ flexGrow: 1 }} />
        <Divider />
        
        {/* Connection info */}
        <List>
          <ListItem key="connector">
            <ListItemIcon>
              <Box
                component="img"
                src="/assets/logo.png"
                alt="DIDHub Logo"
                sx={{ height: 40 }}
              />
            </ListItemIcon>
            <ListItemText 
              primary={"Connected with"} 
              secondary={connectorName} 
              slotProps={{secondary: {fontFamily:'monospace', fontSize: '1.5rem', textTransform:'capitalize'}}}
            />
          </ListItem>
        </List>
      </Box>
    </>
  );

  return isMdUp ? ( 
    <Drawer
      variant='permanent'
      open
      sx={{
        display: { xs: 'none', md: 'block' },
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      { content }
    </Drawer>
  ) : (
    <Drawer
      variant='temporary'
      open={mobileOpen}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        display: { xs: 'block', md: 'none' },
        '& .MuiDrawer-paper': {
          width: drawerWidth, 
          boxSizing: 'border-box',
        },
      }}
    >
      { content }
    </Drawer>
  );
}
