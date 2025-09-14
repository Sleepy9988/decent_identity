import React, { useState } from "react";
import { TextField, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button} from "@mui/material";
import BadgeIcon from '@mui/icons-material/Badge';

/**
 * FormDialog
 * 
 * Simple dialog to capute the purpose of an access request.
 * - Opens when user clicks "Request" button.
 * - Displays a text field for purpose (mandatory).
 * - On submit, calls onSubmitRequest then closes
 * - Shows disabled "Pending" button if request already exists. 
 * 
 * Props:
 * - requested_already: boolean, whether the request is pending already
 * - onSubmitRequest: callback to send request purpose string
 */

export default function FormDialog({ requested_already, onSubmitRequest }) {
    const [open, setOpen] = useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    }

    // Handle form submission: grab purpose from form, call parent.
    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const formJson = Object.fromEntries(formData.entries());
        const purpose = formJson.purpose;

        onSubmitRequest(purpose);
        handleClose();
    }

    return (
        <React.Fragment>
            {requested_already ? (
                <Button aria-label="request" variant="outlined" disabled={requested_already} endIcon={<BadgeIcon />} onClick={handleClickOpen}>
                    Pending
                </Button>
            ) : (
                <Button aria-label="request" variant="outlined" disabled={requested_already} endIcon={<BadgeIcon />} onClick={handleClickOpen}>
                    Request
                </Button>
            )}
            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
                <DialogTitle>Request Access</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please provide the reason for your access request, including your name. The identity owner will be notified and will then make a decision.
                    </DialogContentText>
                    <form onSubmit={handleSubmit} id="request-form">
                        <TextField 
                            autoFocus
                            required
                            margin="normal"
                            id="request"
                            name="purpose"
                            label="Request Purpose"
                            type="text"
                            fullWidth
                            variant="standard"
                        />
                    </form>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button type="submit" form="request-form">
                        Request
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}