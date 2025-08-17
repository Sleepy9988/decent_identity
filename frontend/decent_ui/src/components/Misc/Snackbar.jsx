import React from "react";
import { Snackbar, Alert } from "@mui/material";

export default function SnackbarAlert({ open, setOpen, msg, type }) {

    const handleClose = (e, reason) => {
        if (reason === 'clickaway') {
            return;
        }
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