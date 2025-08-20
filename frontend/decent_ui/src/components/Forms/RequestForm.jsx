import React, { useState } from "react";
import { Box, InputBase, IconButton, Paper, Divider, Typography, List, ListItem, ListItemText } from "@mui/material";
import { getContexts } from '../helper';
import FormDialog from './RequestFormDialog';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { postRequest } from "../helper";
import { useAgent } from '../../services/AgentContext';
import SnackbarAlert from "../Misc/Snackbar";

export default function RequestForm({ created_reqs, onNewRequest }) {
    const [value, setValue] = useState('');
    const [contexts, setContexts] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [open, setOpen] = useState(false);
    const [alertType, setAlertType] = useState('error');

    const { agent, did } = useAgent();

    const created_req_list = created_reqs.map(x => x.context_id);

    const handleClick = async (e) => {
        e.preventDefault();
        setMessage(null);
        
        if (!value.trim().startsWith('did:ethr:sepolia:') || value.length != 59) {
            setMessage('Please enter a valid DID starting with did:ethr:sepolia:...');
            setOpen(true);
            return;
        }
        const did = value.trim();

        try {
            setLoading(true);
            const response = await getContexts(did);
            setContexts(response.contexts);
        } catch (err) {
            setOpen(true);
            setMessage('Error obtaining contexts', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePostRequest = async (contextId, purpose) => {
        try {
            const holderDid = value;
            await postRequest({did, agent, holderDid, contextId, purpose});
            
            setMessage('Request sent successfully');
            setAlertType('success');
            setOpen(true);

            onNewRequest();
        } catch (err) {
            console.error(err);
            setMessage('Failed to send request.');
            setAlertType('error');
            setOpen(true);
        }
    }

    const clearValue = () => {
        setValue('');
    }
   
    return (
        <Box sx={{mt: 5}}>
            <Paper
                component="form"
                variant="outlined"
                sx={{ p: '2px 4px', mb: 5, display: 'flex', alignItems: 'center', width: 800 }}   
            >
                    <InputBase sx={{ ml: 1, flex: 1, fontSize: '1.2rem' }}
                        placeholder="Search DID"
                        inputProps={{ 'aria-label': 'Search DID'}}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                    />
                    <IconButton onClick={clearValue} disabled={!value}> <CloseIcon /></IconButton>
                    <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
                    <IconButton 
                        sx={{ p: '10px' }} 
                        type="submit" 
                        aria-label="search"
                        onClick={handleClick}
                        disabled={loading || !value.trim()}
                    >
                        <SearchIcon />
                    </IconButton>
            </Paper>

            {loading && <Typography>Loading...</Typography>}
            <SnackbarAlert msg={message} open={open} setOpen={setOpen} type={alertType} />

            {contexts && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems:'center', gap: 1, mb: 5 }}>
                    {contexts.length === 0 ? (
                        <Typography sx={{ fontSize: '1.2rem'}}>No public identities available.</Typography>
                    ) : (
                        contexts.map((c) => 
                            <List key={c.id} sx={{ width: '100%', maxWidth: 600, bgcolor: 'background.paper' }}>
                                <ListItem 
                                    secondaryAction={ 
                                        <FormDialog 
                                            requested_already={created_req_list.includes(c.id)}
                                            contextId={c.id}
                                            onSubmitRequest={(purpose) => handlePostRequest(c.id, purpose)} />
                                    }    
                                > 
                                    <ListItemText primary={c.context} />
                                </ListItem>
                            </List>
                        )
                    )}
                </Box>
            )}
        </Box>
    );
}
