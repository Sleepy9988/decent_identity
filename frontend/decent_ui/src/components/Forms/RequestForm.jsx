import React, { useState } from "react";
import { Box, InputBase, Button, IconButton, Paper, Divider, Typography, List, ListItem, ListItemText, Snackbar, Alert } from "@mui/material";
import { getContexts } from '../helper';
import FormDialog from './RequestFormDialog';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { postRequest } from "../helper";
import { useAgent } from '../../services/AgentContext';

export default function RequestForm({ onNewRequest }) {
    const [value, setValue] = useState('');
    const [contexts, setContexts] = useState(null);
    const [loading, setLoading] = useState(false);
    const [err, setError] = useState(null);
    const [open, setOpen] = useState(false);
    const [reqStatus, setReqStatus] = useState(null);

    const { agent, did } = useAgent();
    
    const handleClick = async (e) => {
        e.preventDefault();
        setError(null);
        
        if (!value.trim().startsWith('did:ethr:sepolia:') || value.length != 59) {
            setError('Please enter a valid DID starting with did:ethr:sepolia:...');
            setOpen(true);
            return;
        }
        const did = value.trim();

        try {
            setLoading(true);
            const response = await getContexts(did);
            setContexts(response.contexts);
        } catch (e) {
            setOpen(true);
            console.error(e);
            setError('Error obtaining contexts');
        } finally {
            setLoading(false);
        }
    };

    const handlePostRequest = async (contextId, purpose) => {
        try {
            const holderDid = value;
            setReqStatus('Submitting request...');
            const reqResponse = await postRequest({did, agent, holderDid, contextId, purpose});
            onNewRequest();
            console.log(reqResponse);
        } catch (err) {
            setReqStatus('Failed to send request.', err);
        }
    }
   
    const handleClose = (e, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    }

    const clearValue = () => {
        setValue('');
    }

    const action = (
        <React.Fragment>
            <Button color="secondary" size="small" onClick={handleClose}>
                <IconButton
                    size="small"
                    aria-label="close"
                    color="error"
                    onClick={handleClose}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Button>
        </React.Fragment>
    );

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
            <Snackbar 
                anchorOrigin={{vertical: 'top', horizontal: 'center' }}
                open={open}
                autoHideDuration={5000}
                onClose={handleClose}
                action={action}
            >
                <Alert
                    onClose={handleClose}
                    severity="error"
                    variant="filled"
                    sx={{ width: '100%'}}
                >
                    {err}
                </Alert>
            </Snackbar>

            {contexts && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems:'center', gap: 1, mb: 5 }}>
                    {contexts.length === 0 ? (
                        <Typography sx={{ fontSize: '1.2rem'}}>No public identities found.</Typography>
                    ) : (
                        contexts.map((c) => 
                            <List key={c.id} sx={{ width: '100%', maxWidth: 600, bgcolor: 'background.paper' }}>
                                <ListItem 
                                    secondaryAction={ 
                                        <FormDialog 
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
