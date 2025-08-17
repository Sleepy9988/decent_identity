import * as React from 'react';

import { Box, Typography, Drawer, Toolbar, List, Divider, ListItem, ListItemButton, ListItemIcon, ListItemText} from "@mui/material";

import DashboardIcon from '@mui/icons-material/Dashboard';
import PermIdentityIcon from '@mui/icons-material/PermIdentity';
import InboxIcon from '@mui/icons-material/Inbox';

import { NavLink } from 'react-router-dom';
import { useWeb3AuthConnect } from "@web3auth/modal/react";

const drawerWidth = 320;

const menuItems = [
  {text: 'Dashboard', icon: <DashboardIcon fontSize="large"/>, path: '/dashboard'},
  {text: 'Identities', icon: <PermIdentityIcon fontSize="large" />, path: '/identities' },
  {text: 'Requests', icon: <InboxIcon fontSize="large" />, path: '/requests'},
];

export default function SidebarLeft() {
  const { connectorName } = useWeb3AuthConnect();
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar />
      <Box 
        sx={{ 
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          pt: 10
        }}>
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
        <Box sx={{ flexGrow: 1 }} />
        <Divider />
        <List>
          <ListItem key="connector">
            <ListItemIcon>
              <img src='/assets/logo.png' alt="DIDHub Logo" style={{ height: 40 }} />
            </ListItemIcon>
            <ListItemText 
              primary={"Connected with"} 
              secondary={connectorName} 
              slotProps={{secondary: {fontFamily:'monospace', fontSize: '1.5rem', textTransform:'capitalize'}}}
            />
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
}
