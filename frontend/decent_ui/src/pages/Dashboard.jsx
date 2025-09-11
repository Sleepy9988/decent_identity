import React, { useState, useEffect } from 'react';
import { checkDidOnChain } from '../utils/ethHelper';
import { useAgent } from '../services/AgentContext';
import { ethers } from "ethers";
import { 
    Box, 
    Container, 
    Typography, 
    Card, 
    CardContent, 
    Divider, 
    ButtonGroup, 
    Dialog, 
    DialogContent, 
    Checkbox, 
    TableContainer, 
    Table, 
    TableRow, 
    Paper, 
    TableCell, 
    TableBody
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import IconButton from '@mui/material/IconButton';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import CardCarousel from '../components/Misc/Carousel';
import { QRCodeCanvas } from 'qrcode.react';

/**
 * Dashboard
 * 
 * Main dashboard view for authenticated users.
 * Displays: 
 * - User DID (shortened), with copy-to-clipboard + QR code.
 * - Metadata (account creation, last access).
 * - User's existing identities in a carousel.
 * - Ethereum account information (balance, transactions, network, anchored status).
 */

const Dashboard = () => {
    const { did, id, meta } = useAgent();
    const [qrOpen, setQROpen] = useState(false);
    const [isResolvable, setIsResolvable] = useState(false);

    // Check DID anchoring on-chain whenever DID changes
    useEffect(() => {
        const checkDidAnchored = async () => {
            const res = await checkDidOnChain(did);
            setIsResolvable(res);
        }
        if (did) {
            checkDidAnchored();
        }
    }, [did]);

    // Fallback while Agent data is not yet loaded
    if (!did || !meta) {
        return (
            <Container sx={{ mt: 5, textAlign: 'center' }}>
                <Typography variant="h5">Loading...</Typography>
            </Container>
        );
    }

    // Display values
    const did_display = did.split(":")[3];
    const creation_date = new Date(meta.creation).toLocaleString();
    const last_access = new Date(meta.access).toLocaleString();
    const ethBalance = ethers.formatEther(meta.balance);
    const formattedBalance = parseFloat(ethBalance).toFixed(5);

    return (
        <Box>
            {/* Page Title */}
            <Box component='section' sx={{ mt: 4}}>
                <Typography variant='h3' gutterBottom align='left'>
                    Dashboard
                </Typography>  
            </Box>
            <Divider />

            {/* DID Info Card */}
            <Container component='section' sx={{ mt: 4}}>
                <Card variant='outlined' sx={{ borderRadius: 3, p: 1, backgroundColor: '#1d2f40', mt: 5 }}>
                    <CardContent>
                        <Typography align='left' sx={{ fontSize: '1.5rem'}}>Logged in with address:</Typography>
                        <Box 
                            sx={{
                                mt: 1,
                                p: 2,
                                backgroundColor: '#2d4963',
                                borderRadius: 2, 
                                fontFamily: 'monospace',
                                fontSize: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            {did_display}
                            <ButtonGroup variant="outlined" aria-label="copy and QR button">
                                {/* QR Code button */}
                                <IconButton onClick={() => setQROpen(true)}>
                                    <QrCode2Icon fontSize='medium'/>
                                </IconButton>
                                {/* Copy to clipboard button */}
                                <IconButton 
                                    aria-label='copy' 
                                    onClick={() => navigator.clipboard.writeText(did)}>
                                    <ContentCopyIcon fontSize='medium' />
                                </IconButton>
                            </ButtonGroup>
                        </Box>

                        {/* Meta data */}
                        <Box>
                            <Typography sx={{ mt: 3, fontSize: '1.2rem',textAlign: 'left', mb: 1.5}}>Account creation:&emsp;{creation_date} </Typography>
                            <Typography sx={{ textAlign: 'left',fontSize: '1.2rem'}}>Last access:&emsp;&emsp;&emsp;{last_access}</Typography>
                        </Box>
                    </CardContent>
                </Card>

                {/* QR Code dialog */}
                <Dialog open={qrOpen} onClose={() => setQROpen(false)}>
                    <DialogContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4}}>
                        <QRCodeCanvas value={did} size={240} />
                    </DialogContent>
                </Dialog>
            </Container>

            <Divider sx={{mt: 5}}/>
            
            {/* Identities carousel */}
            <Container maxWidth='xl' sx={{ mt: 5, mb: 4 }}>
                <Typography variant='h5' sx={{textAlign: 'start', mb: 3}}>
                    Existing Identities
                </Typography>
                {id && <CardCarousel identities={id} />}
            </Container>

            <Divider />
            
            {/* Ethereum info */}
            <Container maxWidth='xl' sx={{ mt: 5, mb: 4 }}>
                <Typography variant='h5' sx={{textAlign: 'start', mb: 3}}>
                    Ethereum Information
                </Typography>
                <TableContainer sx={{maxWidth: '600px', borderRadius: 3, overflow: 'hidden'}} component={Paper}>
                    <Table aria-label="ethereum information">
                        <TableBody>
                            <TableRow>
                                <TableCell sx={{ fontSize: '1.1rem', fontWeight: 500 }}>ETH Balance</TableCell>
                                <TableCell sx={{ fontSize: '1.1rem' }}>{formattedBalance}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontSize: '1.1rem', fontWeight: 500 }}>Number of Transactions</TableCell>
                                <TableCell sx={{ fontSize: '1.1rem' }}>{meta.transactions}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontSize: '1.1rem', fontWeight: 500 }}>Network</TableCell>
                                <TableCell sx={{ fontSize: '1.1rem' }}>{meta.network.name.toUpperCase()}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontSize: '1.1rem', fontWeight: 500 }}>Valid DID (Resolvable)</TableCell>
                                <TableCell>
                                    <Checkbox checked={isResolvable} />
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Container>
        </Box>
    );
};

export default Dashboard;