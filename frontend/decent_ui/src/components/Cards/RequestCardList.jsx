import React, { useCallback, useState } from "react";
import { Box, Typography, Card, CardContent, CardHeader, CardActions, Button } from "@mui/material";
import PendingIcon from '@mui/icons-material/Pending';
import ThumbDownAltIcon from '@mui/icons-material/ThumbDownAlt';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import { updateRequest, deleteRequest } from "../helper";
import AlertDialog from "../Misc/AlertDialog";

export default function RequestCardList({ requests, canDecide, onUpdate }) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [reqToDelete, setReqToDelete] = useState(null);

    const getStatusIcon = (status) => {
        switch(status) {
            case "Pending": return <PendingIcon color="primary" />;
            case "Declined": return <ThumbDownAltIcon color="error" />;
            case "Approved": return <ThumbUpAltIcon color="success" />;
            default: return null;
        }
    }

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

    /*
    const handleRequestDelete = async (req_id) => {
        await deleteRequest({request_id: req_id})
        onUpdate();
    };
*/
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
                                <Button size="medium" color="success" onClick={() => handleRequestUpdate(r.id, 'approve', null, '2025-12-01')}>Approve</Button>
                                <Button size="medium" color="error" onClick={() => handleRequestUpdate(r.id, 'decline', 'Not sufficient')}>Decline</Button>
                                </>
                            ) : ( 
                                <Button size="medium" color="primary" onClick={() => handleCancelClick(r.id)}>Cancel Request</Button>
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
