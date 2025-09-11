import React, { useCallback, useState } from "react";
import { 
    Box, 
    Typography, 
    Card, 
    CardContent, 
    CardHeader, 
    CardActions, 
    Button, 
    Dialog, 
    DialogContent, 
    DialogContentText, 
    DialogActions, 
    DialogTitle, 
    TextField, 
    Chip 
} from "@mui/material";
import PendingIcon from '@mui/icons-material/Pending';
import ThumbDownAltIcon from '@mui/icons-material/ThumbDownAlt';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import { updateRequest, deleteRequest, accessApprovedData, revokeAccessApprovedData } from "../../utils/apiHelper";
import AlertDialog from "../Misc/AlertDialog";
import DataDialog from "../Misc/DataDialog";
import DatePickerComponent from "../Misc/DatePicker";
import dayjs from "dayjs";
import SnackbarAlert from "../Misc/Snackbar";
import { useAgent } from '../../services/AgentContext';

/**
 * RequestCardList
 * 
 * Shows a list of access requests with actions depending on role / permission.
 * - Pending requests: approvers can approve (with expiry date) or decline (with reason);
 *   requestors can cancel their own request.
 * - Approved requests: requestors can access data while not expired; approvers can revoke.
 * - Declined / Expired requests are displayed with status only.
 * 
 * Props:
 * - requests: Array of request objects 
 * - canDecide: Boolean flag indicating if the user can approve/decline 
 * - onUpdate: Callback to refresh data after any change
 */
export default function RequestCardList({ requests, canDecide, onUpdate }) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [reqToDelete, setReqToDelete] = useState(null);
    const [open, setOpen] = useState(false);
    const [openAp, setOpenAp] = useState(false);
    const [reqToDecline, setReqToDecline] = useState(null);
    const [selectedDate, setSelectedDate] = useState(dayjs().add(1, 'day'));
    const [reqToApprove, setReqToApprove] = useState(null);
    const [openSnack, setOpenSnack] = useState(false);
    const [messageSnack, setMessageSnack] = useState('');
    const [alertTypeSnack, setAlertTypeSnack] = useState('success');
    const [dataDialogOpen, setDataDialogOpen] = useState(false);
    const [dataToDisplay, setDataToDisplay] = useState({ data: null, context: '', description: '' });
    
    const { signature } = useAgent();
    
    // Visual status icon for each request state.
    const getStatusIcon = (status) => {
        switch(status) {
            case "Pending": return <PendingIcon color="primary" />;
            case "Declined": return <ThumbDownAltIcon color="error" />;
            case "Approved": return <ThumbUpAltIcon color="success" />;
            default: return null;
        }
    }

    // Open the appropriate dialog depending on action type.
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

    // Approve dialog submit: approve with expiry date.
    const handleApproveSubmit = async () => {
        if (!reqToApprove || !selectedDate) return;

        try {
            await handleRequestUpdate(reqToApprove, 'approve', null, selectedDate);
            setOpenSnack(true);
            setMessageSnack('Request approved.');
            setAlertTypeSnack('success');
        } finally {
            handleClose('ap');
            setSelectedDate(null);
            setReqToApprove(null);
        }
    };

    // Close dialogs and reset temp state. 
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

    //Decline form submit handler (captures reason text field).
    const handleSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const formJson = Object.fromEntries(formData.entries());
        const reason = formJson.reason;
        if (!reqToDecline) return;
        try{
            await handleRequestUpdate(reqToDecline, 'decline', reason)
            setOpenSnack(true);
            setMessageSnack('Request declined.');
            setAlertTypeSnack('success');
        } catch (err) {
            console.error(err);
            setOpenSnack(true);
            setMessageSnack('Request could not be declined.');
            setAlertTypeSnack('error');
        } finally {
            handleClose('dc');
        }
    };

    // Requestor cancels their own pending request.
    const handleCancelClick = useCallback((req_id) => {
        setReqToDelete(req_id);
        setDialogOpen(true);
    }, []);

    const handleRequestDelete = useCallback(async () => {
        if (!reqToDelete) return;

        try {
            await deleteRequest({request_id: reqToDelete});
            onUpdate();
            setOpenSnack(true);
            setMessageSnack('Request deleted.');
            setAlertTypeSnack('success');
        } catch (err) {
            console.error("Deletion failed:", err);
            setOpenSnack(true);
            setMessageSnack('Request could not be deleted.');
            setAlertTypeSnack('error');
        } finally {
            setDialogOpen(false);
            setReqToDelete(null);
        }
    }, [reqToDelete, onUpdate]);

    const handleCancelDialog = useCallback(() => {
        setDialogOpen(false);
        setReqToDelete(null);
    },[]);

    const handleCloseDataDialog = useCallback(() => {
        setDataDialogOpen(false);
        setDataToDisplay({ data: null, context: '', description: '' });
    }, []);

    // Generic update function covering approve/decline with optional reason/expiry.
    const handleRequestUpdate = async (req_id, act, reason, expires_at) => {
        const updates = {
            action: act,
            ...(reason ? { reason } : {}),
            ...(expires_at ? { expires_at: new Date(expires_at).toISOString() } : {}),
            ...(act === 'approve' ? {
                signature_holder: signature,
            } : {}),
        };

        await updateRequest({ request_id: req_id, updates });
        onUpdate();
    };

    // Requestor: access approved (encrypted) data using signature. 
    const handleAccessApprovedData = async (reqId) => {
        try {
            if (!signature) {
                console.error('Missing signature.');
                return;
            }

            const request = requests.find(( { id }) => id === reqId);

            if (!request) {
                console.error('Request not found for ID:', reqId)
                return;
            }

            const res = await accessApprovedData({ request_id: reqId, signature })
            setDataToDisplay({
                context: request.context, 
                description: request.description, 
                data: res.data
            });
            setDataDialogOpen(true);
        } catch (err) {
            console.error("Error accessing approved data:", err);
            setOpenSnack(true);
            setMessageSnack('Failed to access data. The data may be expired or inaccessible.');
            setAlertTypeSnack('error');
        }
    }

    const handleRevoke = useCallback(async (reqId) => {
        try {
            await revokeAccessApprovedData({ request_id: reqId });
            onUpdate();
            setOpenSnack(true);
            setMessageSnack('Access revoked.');
            setAlertTypeSnack('success');
        } catch (err) {
            console.error("Revocation failed:", err);
            setOpenSnack(true);
            setMessageSnack('Failed to revoke access.');
            setAlertTypeSnack('error');
        }
    }, [onUpdate]);



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
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                                {getStatusIcon(r.status)}
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <Typography sx={{ ml: 1, textTransform: 'capitalize', fontWeight: 'bold' }}>{r.status}</Typography>
                                    <Typography variant="subtitle2" sx={{ color: '#aaa', fontSize: 'small' }}>
                                        {r.approved_at? new Date(r.approved_at).toLocaleString() : '-'}
                                    </Typography>
                                </Box>
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
                    <SnackbarAlert msg={messageSnack} open={openSnack} setOpen={setOpenSnack} type={alertTypeSnack} />

                    {/* Pending state actions */}
                    {r.status === 'Pending' && (
                        <CardActions>
                            {canDecide ? (
                                <>
                                    <Button variant="outlined" size="medium" color="success"
                                        onClick={() => handleClickOpen('ap', r.id)}
                                    >
                                        Approve
                                    </Button>
                                    {/* Approve dialog with expiry date */}
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
                                    {/* Decline dialog with reason */}
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

                    {/* Approved state actions */}
                    {r.status === 'Approved' && (
                        <>
                        <CardActions>
                            {r.expires_at && new Date(r.expires_at) > new Date() ? (
                                !canDecide ? (
                                    <Button variant="outlined" size="medium" color="warning" onClick={() => handleAccessApprovedData(r.id)}>Access Data</Button>
                                ) : (
                                    <Button variant="outlined" size="medium" color="warning" onClick={() => handleRevoke(r.id)}>Revoke</Button>
                                )
                            ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%'}}>
                                    
                                    <Chip label="EXPIRED" variant="outlined" sx={{}} />
                                </Box>
                            )}
                        </CardActions>
                        <Typography sx={{ textAlign: 'start', color: '#aaa', fontSize: 'small', ml: 1}}>
                            Expires: {r.expires_at? new Date(r.expires_at).toLocaleString() : '-'}
                        </Typography>
                        </>
                    )}
                </Card>
            ))}
            
            <DataDialog 
                open={dataDialogOpen}
                dataToDisplay={dataToDisplay}
                onClose={handleCloseDataDialog}
            />

            {/* Cancel confirmation dialog */}
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
