import React, { useState, useCallback } from "react";
import { Box, Fab, Card, Typography, CardContent, Divider, Tooltip, CardHeader, Stack } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { deleteIdentities, updateIdentity } from "../../utils/apiHelper";
import { useLocation } from "react-router-dom";
import AlertDialog from '../Misc/AlertDialog';
import SnackbarAlert from "../Misc/Snackbar";

/**
 * IdentityCard 
 * 
 * Displays a single identity entry with its identifier attributes.
 * - Shows conext, description, identifier attributes, issuance date, and avatar.
 * - Toggle visbility (active/inactive) with API call.
 * - Delete identity with confirmation dialog and snackbar feedback. 
 * - Calles parent callbacks to sync list state.
 */

export default function IdentityCard ({ identity, onDeleted, onUpdated }) {
    const { id, context, description, issued, decrypted_data, is_active, avatar } = identity;
    const [deleting, setDeleting] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [alertType, setAlertType] = useState('success');
    const location = useLocation();
    const entries = decrypted_data ? Object.entries(decrypted_data) : [];

    // Toggle active/inactive state of identity.
    const handleToggleVisibility = useCallback(async () => {
        if (updating) return;
        try {
            setUpdating(true);
            const res = await updateIdentity(id, !is_active);
            if (onUpdated) onUpdated(id, res.is_active);
        } catch (err) {
            console.error('Visibility update failed', err);
        } finally {
            setUpdating(false);
        }
    }, [id, is_active, updating, onUpdated]);

    // Show confirmation dialog before deletion.
    const handleDeleteClick = useCallback(async () => {
        setOpenDialog(true);
    },[]);

    // Confirm deletion: call API, notify parent, show snackbar.
    const handleConfirmDelete = useCallback(async () => {
        setOpenDialog(false);
        if (deleting) return;
   
        try {
            setDeleting(true);
            await deleteIdentities([id]);
            if (onDeleted) onDeleted(id);
            setOpen(true);
            setMessage('Identity deleted successfully.');
            setAlertType('success');
        } catch (err) {
            console.error("Deletion failed", err);
            setOpen(true);
            setMessage('Identity could not be deleted.');
            setAlertType('error');
        } finally {
            setDeleting(false);
        }
    }, [id, deleting, onDeleted]);

    const handleCancelDelete = useCallback(() => {
        setOpenDialog(false);
    }, []);

    return (
        <Card sx={{ p: 2, backgroundColor: '#2d4963', borderRadius: 3, color: '#fff', minHeight: 300 }}>
            <CardHeader
                avatar={
                     avatar? (
                        <img 
                            src={avatar} 
                            alt="avatar" loading='lazy' 
                            style={{ 
                                width: '80px', 
                                height: '80px', 
                                borderRadius: '50%', 
                                objectFit: 'cover',
                                marginRight: '16px' 
                            }}
                        />
                    ) : null
                }
                title={<Typography variant="h5" gutterBottom sx={{ textAlign: 'start'}}>Context: {context}</Typography>}
                subheader={<Typography variant="h6" gutterBottom sx={{ color: '#ccc', textAlign: 'start' }}>Description: {description}</Typography>}
                action={
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        {location.pathname === '/identities' && (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                {is_active ? (
                                    <Tooltip title="Hide">
                                        <span>
                                            <Fab aria-label="visible" size="small" sx={{ mr: 3}} disabled={deleting || updating} onClick={handleToggleVisibility}>
                                                <VisibilityIcon color='primary' />
                                            </Fab>
                                        </span>
                                    </Tooltip>
                                ) : (
                                    <Tooltip title="Show">
                                        <span>
                                            <Fab aria-label="hidden" size="small" sx={{ mr: 3}} disabled={deleting || updating} onClick={handleToggleVisibility}>
                                                <VisibilityOffIcon sx={{ color: '#A4ABB6' }} />
                                            </Fab>
                                        </span>
                                    </Tooltip>
                                )
                                }
                                <Tooltip title="Delete">
                                    <span>
                                        <Fab aria-label="delete" size="small" onClick={handleDeleteClick} disabled={deleting}>
                                            <DeleteIcon color='error' />
                                        </Fab>
                                    </span>
                                </Tooltip>
                                <SnackbarAlert msg={message} open={open} setOpen={setOpen} type={alertType} />
                            </Box>
                        )}
                    </Box>
                }
            />
            <Divider sx={{ borderColor: 'white'}} />
            <CardContent>
                {entries.length > 0 ? (
                    <Stack spacing={1} sx={{width: '100%'}}>
                        {entries.map(([key, value]) => (
                            <Box key={key} sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                <Typography
                                    variant="body1"
                                    sx={{ fontWeight: 600, width: 200, textAlign: 'start', textTransform: 'capitalize', lineHeight: 2, mr: 2 }}>
                                    {key}:
                                </Typography>
                                <Typography variant="body1" sx={{ ml: 1, lineHeight: 2 }}>
                                    {String(value)}
                                </Typography>
                            </Box>
                        ))}
                    </Stack>
                ) : (
                    <Typography variant="body2" sx={{ color: '#ddd' }}>No attributes available.</Typography>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2}}>
                    <Typography sx={{ textAlign: 'end', color: '#aaa', fontSize: 'small'}}>
                        Issued: {issued? new Date(issued).toLocaleString() : '-'}<br/>
                        Id: {id}
                    </Typography>
                </Box>   
            </CardContent>
            <AlertDialog
                open={openDialog}
                title="Confirm Deletion"
                text="Are you sure you want to delete this identity permanently? This action cannot be undone."
                onAgree={handleConfirmDelete}
                onClose={handleCancelDelete}
            />
        </Card>
    );
}