import React, { useState } from "react";
import { TextField, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button} from "@mui/material";
import BadgeIcon from '@mui/icons-material/Badge';

export default function FormDialog({ onSubmitRequest }) {
    const [open, setOpen] = useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    }

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
            <Button aria-label="request" variant="outlined" endIcon={<BadgeIcon />} onClick={handleClickOpen}> Request</Button>
            <Dialog open={open} onClose={handleClose}>
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