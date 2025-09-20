import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack, Box, Typography }from '@mui/material';

/**
 * DataDialog
 * 
 *  Dialog to display approved data
 * - Displays a title and descriptive text.
 * 
 * Props:
 * - open: boolean, controls visibility
 * - title: string, dialog title 
 * - text: string, description text.
 * - onAgree: callback when Confirm button is clicked
 * - onClose: callback when Cancel button or backdrop is clicked 
 */
export default function DataDialog({ open, dataToDisplay, onClose }) {
    const { data, context, description } = dataToDisplay;
    if (!data) return null;

    const dataObject = Object.entries(data);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            aria-labelledby="data-dialog-title"
            aria-describedby="data-dialog-description"
            fullWidth
            maxWidth="sm"
            slotProps={{
                paper: {
                    sx: { 
                        width: '100%',
                        maxWidth: 820,
                    }
            },
        }}
        >
        <DialogTitle id="data-dialog-title">
           <Typography sx={{ fontWeight: 600, fontSize: '1.5rem' }}>{context}</Typography> 
            <Typography>{description}</Typography>
        </DialogTitle>
        <DialogContent>
            <DialogContentText id="data-dialog-description" component="div">
                <Stack spacing={1} sx={{width: '100%'}}>
                    {dataObject.map(([key, value]) => (
                        <Box key={key} sx={{ display: 'flex', alignItems: 'flex-start', flexDirection: { xs: 'column', sm: 'row' } }}>
                            <Typography
                                variant="body1"
                                sx={{ 
                                    fontWeight: 600, 
                                    width: { xs: '100%', sm: 200 },
                                    textAlign: 'start', 
                                    textTransform: 'capitalize', 
                                    lineHeight: 2, 
                                    mr: { xs: 0, sm: 2 },
                                    color: 'white' 
                                }}
                            >
                                {key}:
                            </Typography>
                            <Typography variant="body1" sx={{ ml: { xs: 0, sm: 1 }, lineHeight: 2, wordBreak: 'break-word' }}>
                                {String(value)}
                            </Typography>
                        </Box>
                    ))}
                </Stack>
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>Close</Button>
        </DialogActions>
        </Dialog>
    );
}
