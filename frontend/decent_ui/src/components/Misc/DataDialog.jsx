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
        slotProps={{
            paper: {
                sx: { 
                minWidth: 500, 
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
                        <Box key={key} sx={{ display: 'flex', alignItems: 'center'}}>
                            <Typography
                                variant="body1"
                                sx={{ fontWeight: 600, width: 200, textAlign: 'start', textTransform: 'capitalize', lineHeight: 2, mr: 2, color: 'white' }}>
                                {key}:
                            </Typography>
                            <Typography variant="body1" sx={{ ml: 1, lineHeight: 2 }}>
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
