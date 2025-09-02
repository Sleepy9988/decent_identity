import React from "react";
import { Snackbar, Alert } from "@mui/material";

/**
 * SnackbarAlert
 * 
 * Wrapper around MUI Snackbar & Alert 
 * - Displays a temporary notification at the top-center. 
 * - Auto-hides after 5 seconds.
 * - Dismissable manually or on close callback.
 * 
 * Props:
 * - open: boolean, controls visibility.
 * - setOpen: state setter function to toggle visibility. 
 * - msg: string, message text to display.
 * - type: severity string for alert (success, error, warning, info)
 */

export default function SnackbarAlert({ open, setOpen, msg, type }) {

    const handleClose = (e, reason) => {
        if (reason === 'clickaway') return;
        setOpen(false);
    }
    
    return (
        <Snackbar 
            anchorOrigin={{vertical: 'top', horizontal: 'center' }}
            open={open}
            autoHideDuration={5000}
            onClose={handleClose}
        >
            <Alert
                onClose={handleClose}
                severity={type}
                variant="filled"
                sx={{ width: '100%'}}
            >
                {msg}
            </Alert>
        </Snackbar>
    )
}