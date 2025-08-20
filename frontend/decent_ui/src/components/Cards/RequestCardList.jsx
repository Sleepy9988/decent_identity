import React, { useCallback, useState } from "react";
import { Box, Typography, Card, CardContent, CardHeader, CardActions, Button, Dialog, DialogContent, DialogContentText, DialogActions, DialogTitle, TextField } from "@mui/material";
import PendingIcon from '@mui/icons-material/Pending';
import ThumbDownAltIcon from '@mui/icons-material/ThumbDownAlt';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import { updateRequest, deleteRequest } from "../helper";
import AlertDialog from "../Misc/AlertDialog";
import DatePickerComponent from "../Misc/DatePicker";
import dayjs from "dayjs";

export default function RequestCardList({ requests, canDecide, onUpdate }) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [reqToDelete, setReqToDelete] = useState(null);
    const [open, setOpen] = useState(false);
    const [openAp, setOpenAp] = useState(false);
    const [reqToDecline, setReqToDecline] = useState(null);
    const [selectedDate, setSelectedDate] = useState(dayjs().add(1, 'day'));
    const [reqToApprove, setReqToApprove] = useState(null);

    const getStatusIcon = (status) => {
        switch(status) {
            case "Pending": return <PendingIcon color="primary" />;
            case "Declined": return <ThumbDownAltIcon color="error" />;
            case "Approved": return <ThumbUpAltIcon color="success" />;
            default: return null;
        }
    }

    const handleClickOpen = (type, req_id) => {
        if (type === 'dc') {
            setReqToDecline(req_id);
            setOpen(true);
        }
        if (type === 'ap') {
            setReqToApprove(req_id);
            setOpenAp(true);
        }
    };

    const handleApproveSubmit = async () => {
        if (!reqToApprove || !selectedDate) return;

        try {
            await handleRequestUpdate(reqToApprove, 'approve', null, selectedDate);
        } finally {
            handleClose('ap');
            setSelectedDate(null);
            setReqToApprove(null);
        }
    };

    const handleClose = (type) => {
        setReqToDecline(null);
        if (type === 'ap') {
            setOpenAp(false);
            setReqToApprove(null);
            setSelectedDate(dayjs().add(1, 'day'));
        }
        if (type === 'dc') {
            setOpen(false);
            setReqToDecline(null);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const formJson = Object.fromEntries(formData.entries());
        const reason = formJson.reason;
        if (!reqToDecline) return;
        await handleRequestUpdate(reqToDecline, 'decline', reason)
        handleClose();
    };

    const handleCancelClick = useCallback((req_id) => {
        setReqToDelete(req_id);
        setDialogOpen(true);
    }, []);

    const handleRequestDelete = useCallback(async () => {
        if (!reqToDelete) return;

        try {
            await deleteRequest({request_id: reqToDelete});
            onUpdate();
        } catch (err) {
            console.error("Deletion failed:", err);
        } finally {
            setDialogOpen(false);
            setReqToDelete(null);
        }
    }, [reqToDelete, onUpdate]);

    const handleCancelDialog = useCallback(() => {
        setDialogOpen(false);
        setReqToDelete(null);
    },[]);

    const handleRequestUpdate = async (req_id, act, reason, expires_at) => {
        await updateRequest({
            request_id: req_id,
            updates: { 
                action: act, 
                ...(reason ? { reason } : {}),
                ...(expires_at ? { expires_at: new Date(expires_at).toISOString() } : {}),
         }
        });
        onUpdate();
    };

    if (!Array.isArray(requests) || requests.length === 0) {
        return <Typography sx={{ mt: 3 }}> There are no requests yet.</Typography>;
    }

    return (
        <Box sx={{mt: 5}}>
            {requests.map((r) => (
                <Card key={r.id} sx={{ p: 2, color: '#fff', maxWidth: 1200, mb: 3 }}>
                    <CardHeader
                        title={<Typography variant='h6' gutterBottom sx={{ textAlign: 'start'}}><b>Requested Context:</b> {r.context}</Typography>}
                        subheader={<Typography sx={{ color: 'text.secondary', textAlign: 'start' }}>Requestor: {r.requestor_did}</Typography>}
                        action={
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                {getStatusIcon(r.status)}
                                <Typography sx={{ ml: 1, textTransform: 'capitalize', fontWeight: 'bold' }}>{r.status}</Typography>
                            </Box>
                        }
                    />
                    <CardContent>
                        <Typography variant="body1" sx={{ textAlign: 'start', fontSize: '1.2rem'}}> <b>Purpose:</b><br />{r.purpose}</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2}}>
                            <Typography sx={{ textAlign: 'end', color: '#aaa', fontSize: 'small'}}>
                                Request Date: {r.created_at? new Date(r.created_at).toLocaleString() : '-'}<br/>
                                Id: {r.id}
                            </Typography>
                        </Box>
                    </CardContent>
                    
                    {r.status === 'Pending' && (
                        <CardActions>
                            {canDecide ? (
                                <>
                                    <Button variant="outlined" size="medium" color="success"
                                        onClick={() => handleClickOpen('ap', r.id)}
                                    >
                                        Approve
                                    </Button>
                                    <Dialog open={openAp} onClose={() => handleClose('ap')}>
                                        <DialogTitle>Expiry Date</DialogTitle>
                                        <DialogContent>
                                            <DatePickerComponent value={selectedDate} onChange={(date) => setSelectedDate(date)}/>
                                        </DialogContent>
                                        <DialogActions>
                                            <Button onClick={() => handleClose('ap')}>Cancel</Button>
                                            <Button type="submit" form="subscription-form" onClick={handleApproveSubmit}>
                                                Submit
                                            </Button>
                                        </DialogActions>
                                    </Dialog>

                                    <Button variant="outlined" size="medium" color="error" 
                                        onClick={() => handleClickOpen('dc', r.id)}
                                    >
                                        Decline
                                    </Button>
                                    <Dialog open={open} onClose={() => handleClose('dc')}>
                                        <DialogTitle>Decline Request</DialogTitle>
                                        <DialogContent>
                                            <DialogContentText>
                                                Provide a reason why you declined the request.
                                            </DialogContentText>
                                            <form onSubmit={handleSubmit} id="subscription-form">
                                                <TextField
                                                autoFocus
                                                margin="dense"
                                                id="name"
                                                name="reason"
                                                label="Reason"
                                                type="text"
                                                fullWidth
                                                variant="standard"
                                                />
                                            </form>
                                        </DialogContent>
                                        <DialogActions>
                                        <Button onClick={() => handleClose('dc')}>Cancel</Button>
                                        <Button type="submit" form="subscription-form">
                                            Decline
                                        </Button>
                                        </DialogActions>
                                    </Dialog>
                                </>
                            ) : ( 
                                <Button variant="outlined" size="medium" color="primary" onClick={() => handleCancelClick(r.id)}>Cancel Request</Button>
                            )}
                        </CardActions>
                    )}
                </Card>
            ))}
            <AlertDialog
                open={dialogOpen}
                title="Confirm Cancellation"
                text="Are you sure you want to cancel this request? This action cannot be undone."
                onAgree={handleRequestDelete}
                onClose={handleCancelDialog}
            />
        </Box>
    );
}
