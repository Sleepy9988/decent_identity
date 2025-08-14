import React, { useState } from "react";
import { Box, Fab, Card, Typography, CardContent, Divider, Tooltip, CardHeader } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import { deleteIdentities } from '../helper';
import { useLocation } from "react-router-dom";

export default function IdentityCard ({ identity, onDeleted }) {
    const { id, context, description, issued, decrypted_data } = identity;
    const [deleting, setDeleting] = useState(false);
    const location = useLocation();
    const entries = decrypted_data ? Object.entries(decrypted_data) : [];

    const handleDelete = async () => {
        if (deleting) return;
        const ok = window.confirm("Delete this identity permanently?");
        if (!ok) return;

        try {
            setDeleting(true);
            await deleteIdentities([id]);
            if (onDeleted) onDeleted(id);
        } catch (err) {
            console.error("Deletion failed", err);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Card sx={{ p: 2, backgroundColor: '#2d4963', borderRadius: 3, color: '#fff', minHeight: 300 }}>
            <CardHeader
                title={<Typography variant="h5" gutterBottom sx={{ textAlign: 'start'}}>Context: {context}</Typography>}
                subheader={<Typography variant="h6" gutterBottom sx={{ color: '#ccc', textAlign: 'start' }}>Description: {description}</Typography>}
                action={
                    location.pathname == '/identities' &&
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Edit">
                                <span>
                                    <Fab aria-label="edit" size="small" sx={{ mr: 3}} disabled={deleting} >
                                        <EditIcon color='primary' />
                                    </Fab>
                                </span>
                            </Tooltip>
                            <Tooltip title="Delete">
                                <span>
                                    <Fab aria-label="delete" size="small" onClick={handleDelete} disabled={deleting}>
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
        </Card>
    );
}