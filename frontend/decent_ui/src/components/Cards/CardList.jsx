import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Box, Typography, Checkbox, FormControlLabel, Button, ButtonGroup } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import ShareIcon from '@mui/icons-material/Share';
import DownloadIcon from '@mui/icons-material/Download';
import IdentityCard from './IdentityCard';
import AlertDialog from "../Misc/AlertDialog";
import { useAgent } from '../../services/AgentContext';
import { deleteIdentities } from "../../utils/apiHelper";
import { handleDownload } from "../../utils/download";
import SnackbarAlert from "../Misc/Snackbar";

/**
 * CardList
 * 
 * Displays identity cards with mass actions (select, download, delete).
 * 
 * - Individual and "Select All" checkboxes.
 * - Mass delete with confirmation dialog.
 * - Mass download of selected identities.
 * - Keeps context in sync after updates or deletions.
 * 
 */

export default function CardList({ identities }) {
    const { setIdentity} = useAgent();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selected, setSelected] = useState(() => new Set());
    const [snackOpen, setSnackOpen] = useState(false);
    const [snackMsg, setSnackMsg] = useState('');
    const [snackType, setSnackType] = useState('success');

    const notify = useCallback((msg, type = 'success') => {
        setSnackMsg(msg);
        setSnackType(type);
        setSnackOpen(true);
    }, []);

    // Update active status (visibility) of a specific identity in context.
    const handleIdentityUpdated = (id, newIsActive) => {
        setIdentity(prev => prev.map(identity => identity.id === id ? { ...identity, is_active: newIsActive } : identity));
    };

    // Trigger mass delete confirmation.
    const handleMassDelete = useCallback(async () => {
        if (selected.size === 0) return;
        setDialogOpen(true);
    }, [selected]);

    // Confirm mass deletion: call API, update context, reset selection.
    const handleDialogConfirm = useCallback(async () => {
        setDialogOpen(false);
        const idsDelete = [...selected];

        try {
            await deleteIdentities(idsDelete);
            setIdentity(prev => prev.filter(i => !idsDelete.includes(i.id)));
            setSelected(new Set());
            notify('Identities deleted successfully!', 'success');
        } catch (err) {
            console.error("Bulk deletion failed", err);
            notify('Identities could not be deleted.', 'error');
        }
    }, [selected, setIdentity, notify]);

    const handleDialogCancel = useCallback(() => {
        setDialogOpen(false)
    }, []);

    // Reset the selection whenever the identities list changes. 
    useEffect(() => {
        setSelected(new Set());
    }, [identities]);

    const allIds = useMemo(() => identities.map(i => i.id), [identities]);
    const total = identities.length;
    const numSelected = selected.size;
    const allSelected = numSelected === total && total > 0;
    const someSelected = numSelected > 0 && numSelected < total;   

    // Select/unselect all identities.
    const toggleSelectAll = useCallback((e) => {
        if (e.target.checked) {
            setSelected(new Set(allIds));
        } else {
            setSelected(new Set());
        }
    }, [allIds]);

    // Toggle selection of single identity.
    const toggleOne = useCallback((id) => (e) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (e.target.checked) next.add(id);
            else next.delete(id);
            return next;
        })
    }, []);

    // Remove one identity after deletion from child card. 
    const handleDeleted = useCallback((deletedId) => {
        setIdentity(prev => prev.filter(i => i.id !== deletedId));
        setSelected(prev => {
            const next = new Set(prev);
            next.delete(deletedId);
            return next;
        });
    }, [setIdentity]);

    if (!Array.isArray(identities) || identities.length === 0) {
        return <Typography sx={{ mt: 3 }}>There are no identities yet.</Typography>;
    }

    return (
        <Box>
            {/* Toolbar with select-all and bulk actions */}
            <Box sx={{display: 'flex', flexDirection: 'row', justifyContent:'start', mt: 2, maxWidth: '1100px'}}>
                <Box>
                    <FormControlLabel
                        label='Select all'
                        control={<Checkbox
                            checked={allSelected}
                            indeterminate={someSelected}
                            onChange={toggleSelectAll}
                        />}
                    />
                </Box>
                <Box sx={{flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
                    <ButtonGroup variant='outlined' disabled={!someSelected && !allSelected}>
                        <Button startIcon={<DownloadIcon />} onClick={() => handleDownload('Identities', identities, [...selected])}>Download</Button>
                        <Button startIcon={<ShareIcon />} disabled={true}>Share</Button>
                        <Button startIcon={<DeleteIcon />} onClick={handleMassDelete}>Delete</Button>
                    </ButtonGroup>
                </Box>
                <AlertDialog
                    open={dialogOpen}
                    title="Confirm Mass Deletion"
                    text={`Do you want to permanently delete ${selected.size} selected identities?`}
                    onAgree={handleDialogConfirm}
                    onClose={handleDialogCancel}
                />
            </Box>
            
            <SnackbarAlert msg={snackMsg} open={snackOpen} setOpen={setSnackOpen} type={snackType} />

            {/* List of identities with checkboxes */}
            <Box sx={{ mt: 5, mb: 5, maxWidth: '1000px', display: 'flex', flexDirection: 'column', gap: 3}}>
            {identities.map((identity) => {
                const checked = selected.has(identity.id);
                return (
                <Box key={identity.id} sx={{display: 'flex', gap: 2, alignItems: 'center'}}>
                    <Box sx={{ width: 40, display: 'flex', justifyContent: 'center', pt: 1}}>
                        <FormControlLabel 
                            control={
                                <Checkbox 
                                    checked={checked} onChange={toggleOne(identity.id)}
                                />
                            } 
                        />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <IdentityCard 
                            //key={identity.id} 
                            identity={identity} 
                            onDeleted={handleDeleted}
                            onUpdated={handleIdentityUpdated}
                            onNotify={notify}
                        />
                    </Box>
                </Box>
                );
            })}
            </Box>
        </Box>
    );
}
