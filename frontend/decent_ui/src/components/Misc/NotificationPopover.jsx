import React, { useState } from 'react';
import { Popover, Typography, Badge, Box, List, ListItem, ListItemText, Divider, Button } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useAgent } from '../../services/AgentContext';

/**
 * NotificationPopover
 * 
 * Displays a bell icon with a badge count of notifications.
 * Clicking opens a Popover listing all notifications.
 * - Each notification shows event type, optinal context, and timestamp.
 * - Provides a "Mark all as read" button that clears the notifications.
 */

export default function NotificationPopover() {
    const { notifications, clearNotifications } = useAgent();

    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handlePopoverOpen = (event) => setAnchorEl(event.currentTarget);
    const handlePopoverClose = () => setAnchorEl(null);
    
    const handleMarkAllRead = () => { 
        clearNotifications(); 
        handlePopoverClose(); 
    };

    return (
        <Box>
            {/* Bell icon with badge */}
            <Badge 
                color='warning' 
                sx={{mr: 10}} 
                badgeContent={notifications.length}
                aria-owns={open ? 'mouse-over-popover' : undefined}
                aria-haspopup="true"
                onClick={handlePopoverOpen}
            >
                <NotificationsIcon 
                    fontSize="large" 
                    color='action' 
                    
                />
            </Badge>
            
            {/* Popover with notifications list */}
            <Popover
                id="notif-popover"
                open={open}
                anchorEl={anchorEl}
                onClose={handlePopoverClose}
                anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
                transformOrigin={{vertical: 'top', horizontal: 'left'}}
            >
                <Box sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper', p: 5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1">Notifications</Typography>
                        {!!notifications.length && (
                            <Button size="small" onClick={handleMarkAllRead}>Mark all as read</Button>
                        )}
                    </Box>
                    <List dense>
                        {notifications.length > 0? (
                            notifications.map((notification, index) => (
                                <React.Fragment key={index}>
                                    <ListItem disablePadding>
                                        <ListItemText 
                                            primary={notification.event.toUpperCase()}
                                            secondary={
                                                 <React.Fragment>
                                                    {notification.context?.context && (
                                                        <Typography
                                                            component="span"
                                                            variant="body2"
                                                            color="text.secondary"
                                                        >
                                                            {notification.context.context}
                                                        </Typography>
                                                    )}
                                                    {notification.created_at && (
                                                        <Typography variant="body2" sx={{ display: 'block', mt: 0.5 }}>
                                                            {new Date(notification.created_at).toLocaleString()}
                                                        </Typography>
                                                    )}
                                                </React.Fragment>
                                            }
                                        />
                                    </ListItem>
                                    {index < notifications.length - 1 && <Divider />}
                                </React.Fragment>
                            ))
                        ) : (
                            <ListItem>
                                <ListItemText primary="No new notifications" />
                            </ListItem>
                        )}
                    </List>
                </Box>
            </Popover>
        </Box>
    );
}