import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle }from '@mui/material';

/**
 * AlertDialog
 * 
 * Generic confirmation dialog
 * - Displays a title and descriptive text.
 * - Provides Cancel and Confirm buttons. 
 * 
 * Props:
 * - open: boolean, controls visibility
 * - title: string, dialog title 
 * - text: string, description text.
 * - onAgree: callback when Confirm button is clicked
 * - onClose: callback when Cancel button or backdrop is clicked 
 */
export default function AlertDialog({ open, title, text, onAgree, onClose }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {text}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onAgree} autoFocus>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
