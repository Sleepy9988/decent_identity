import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Box, Typography, Checkbox, FormControlLabel, Button, ButtonGroup } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import ShareIcon from '@mui/icons-material/Share';
import DownloadIcon from '@mui/icons-material/Download';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import IdentityCard from "./IdentityCard";

import { useAgent } from '../../services/AgentContext';
import { deleteIdentities } from "../helper";

export default function CardList({ identities }) {
    const { setIdentity} = useAgent();

    const [selected, setSelected] = useState(() => new Set());

    useEffect(() => {
        setSelected(new Set());
    }, [identities]);

    const allIds = useMemo(() => identities.map(i => i.id), [identities]);
    const total = identities.length;
    const numSelected = selected.size;
    const allSelected = numSelected === total && total > 0;
    const someSelected = numSelected > 0 && numSelected < total;

    const toggleSelectAll = useCallback((e) => {
        if (e.target.checked) {
            setSelected(new Set(allIds));
        } else {
            setSelected(new Set());
        }
    }, [allIds]);

    const toggleOne = useCallback((id) => (e) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (e.target.checked) next.add(id);
            else next.delete(id);
            return next;
        })
    }, []);

    const handleDeleted = useCallback((deletedId) => {
        setIdentity(prev => prev.filter(i => i.id != deletedId));
        setSelected(prev => {
            const next = new Set(prev);
            next.delete(deletedId);
            return next;
        });
    }, [setIdentity]);

    const handleMassDelete = useCallback(async () => {
        if (selected.size === 0) return;
        const ok = window.confirm(`Permanentely delete ${selected.size} selected identities?`);
        if (!ok) return;

        const idsDelete = [...selected];

        try {
            await deleteIdentities(idsDelete);
            setIdentity(prev => prev.filter(i => !selected.has(i.id)));
            setSelected(new Set());
        } catch (err) {
            console.error("Bulk deletion failed", err);
        }
    }, [selected, setIdentity]);

    if (!Array.isArray(identities) || identities.length === 0) {
        return <Typography sx={{ mt: 3 }}> You don't have any identities yet.</Typography>;
    }

    return (
        <Box>
            <Typography sx={{mt: 2, textAlign: 'start' }}>Identity count: {total}</Typography>
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
                        <Button startIcon={<DownloadIcon />}>Download</Button>
                        <Button startIcon={<ShareIcon />}>Share</Button>
                        <Button startIcon={<DeleteIcon />} onClick={handleMassDelete}>Delete</Button>
                    </ButtonGroup>
                </Box>
            </Box>
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
                            key={identity.id} 
                            identity={identity} 
                            onDeleted={handleDeleted}
                        />
                    </Box>
                </Box>
                );
            })}
            </Box>
        </Box>
    );
}
