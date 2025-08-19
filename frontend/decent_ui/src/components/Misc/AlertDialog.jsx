import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle }from '@mui/material';

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
