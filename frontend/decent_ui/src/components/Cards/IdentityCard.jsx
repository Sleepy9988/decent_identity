import React, { useState, useCallback } from "react";
import { Box, Fab, Card, Typography, CardContent, Divider, Tooltip, CardHeader } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
//import { deleteIdentities, updateIdentity } from '../helper';
import { deleteIdentities, updateIdentity } from "../../utils/apiHelper";
import { useLocation } from "react-router-dom";
import AlertDialog from '../Misc/AlertDialog';

export default function IdentityCard ({ identity, onDeleted, onUpdated }) {
    const { id, context, description, issued, decrypted_data, is_active } = identity;
    const [deleting, setDeleting] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [updating, setUpdating] = useState(false);
    const location = useLocation();
    const entries = decrypted_data ? Object.entries(decrypted_data) : [];

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

    const handleDeleteClick = useCallback(async () => {
        setOpenDialog(true);
    },[]);

    const handleConfirmDelete = useCallback(async () => {
        setOpenDialog(false);
        if (deleting) return;
   
        try {
            setDeleting(true);
            await deleteIdentities([id]);
            if (onDeleted) onDeleted(id);
        } catch (err) {
            console.error("Deletion failed", err);
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
                title={<Typography variant="h5" gutterBottom sx={{ textAlign: 'start'}}>Context: {context}</Typography>}
                subheader={<Typography variant="h6" gutterBottom sx={{ color: '#ccc', textAlign: 'start' }}>Description: {description}</Typography>}
                action={
                    location.pathname == '/identities' &&
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
                                            <VisibilityOffIcon color='primary' />
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
                        </Box>
                }
            />
            <Divider sx={{ my: 2, borderColor: 'white'}} />
            <CardContent>
                {entries.length > 0 ? (
                    <Box component="dl" sx={{ mb: 1 }}>
                        {entries.map(([key, value]) => (
                            <Box key={key} sx={{ display: 'flex' }}>
                                <Typography
                                    variant="body1"
                                    sx={{ fontWeight: 600, minWidth: 100, textAlign: 'start', textTransform: 'capitalize', lineHeight: 2 }}>
                                    {key}:
                                </Typography>
                                <Typography variant="body1" sx={{ ml: 1, lineHeight: 2 }}>
                                    {String(value)}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
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