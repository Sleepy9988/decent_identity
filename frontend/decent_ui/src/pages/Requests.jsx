import React, { useState, useEffect, useCallback } from 'react';
import { Container, Box, Typography, Tabs, Tab, Divider, Autocomplete, TextField, Pagination } from '@mui/material';
import RequestForm from '../components/Forms/RequestForm';
import RequestCardList from '../components/Cards/RequestCardList';
import { getRequests } from '../utils/apiHelper';
import { useAgent } from '../services/AgentContext';

/**
 * Requests 
 * 
 * Page for managing identity data access requests.
 * Features:
 *  - Tabbed interface for 
 *      1. New request form
 *      2. Requests received from others.
 *      3. Requests created by the user. 
 * - Filtering by request status (All, Approved, Pending, Declined)
 * - Pagination for long lists of requests. 
 */

const Requests = () => {
    const [value, setValue] = useState("1");
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('All');
    
    const { did } = useAgent();

    const [currentPage, setCurrentPage] = useState(1);
    const cardsPerPage = 5; 

    // Load all requests from API
    const loadRequest = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getRequests();
            setRequests(res.results || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRequest();
    }, [loadRequest]);

    const handleRequestCreation = async () => {
        loadRequest();
    };

    const handleChange = (e, newValue) => {
        setValue(newValue);
    };

    // Status filter component
    const StatusFilter = () => {
        return ( 
            <Autocomplete 
                options={['All','Approved', 'Pending', 'Declined']}
                sx={{ width: 300, mt: 5 }}
                renderInput={(params) => <TextField { ...params} label="Status" />}
                value={status}
                onChange={(e, newStatus) => {
                    setStatus(newStatus);
                }}
            />
        );
    };

    // Separate requests for created vs. received
    const created_reqs = requests.filter((req) => {
        return req.requestor_did === did && (status === 'All' || req.status === status);
    });
    const received_reqs = requests.filter((req) => {
        return req.holder_did === did && (status === 'All' || req.status === status);
    });

    // Calculate pagination slices
    const idxLastCard = currentPage * cardsPerPage;
    const idxFirstCard = idxLastCard - cardsPerPage;
    const currentCardsReq = created_reqs.slice(idxFirstCard, idxLastCard);
    const currentCardsRec = received_reqs.slice(idxFirstCard, idxLastCard);

    return (
        <Box>
            {/* Page Header */}
            <Box component='section' sx={{ mt: 4, display: 'flex', justifyContent: 'space-between'}}>
                <Typography variant="h3" gutterBottom align="left">
                    Requests
                </Typography> 
            </Box>

            <Divider />

            {/* Tabs */}
            <Container component='section' sx={{ mt: 4}}>
                <Tabs value={value} onChange={handleChange} centered>
                    <Tab label='New Request' sx={{fontSize: '1rem', mr: 5}} value="1" />
                    <Tab label='Received Requests' sx={{fontSize: '1rem', mr: 5}} value="2" />
                    <Tab label='Created Requests' sx={{fontSize: '1rem'}} value="3" />
                </Tabs>

                {/* Tab 1: New Request */}
                {value === "1" && (
                    <RequestForm created_reqs={created_reqs} onNewRequest={handleRequestCreation} />
                )}

                {/* Tab 2: Received Requests */}
                {value == "2" && (
                    <> 
                        {loading && <Typography sx={{ mt: 3 }}>Loading...</Typography>}
                        <StatusFilter />
                        {!loading && <RequestCardList requests={currentCardsRec} canDecide={true} onUpdate={loadRequest} />}
                        <Box sx={{ mt: 2, mb:5, display: 'flex', justifyContent: 'center'}}>
                            <Pagination
                                count={Math.ceil(received_reqs.length / cardsPerPage)}
                                page={currentPage}
                                onChange={(event, value) => setCurrentPage(value)}
                            />
                        </Box>
                    </>
                )}

                {/* Tab 3: Created Requests */}
                {value == "3" && (
                    <> 
                        {loading && <Typography sx={{ mt: 3 }}>Loading...</Typography>}
                        <StatusFilter />
                        {!loading && <RequestCardList requests={currentCardsReq} canDecide={false} onUpdate={loadRequest} />}
                        <Box sx={{ mt: 2, mb:5, display: 'flex', justifyContent: 'center'}}>
                            <Pagination
                                count={Math.ceil(created_reqs.length / cardsPerPage)}
                                page={currentPage}
                                onChange={(event, value) => setCurrentPage(value)}
                            />
                        </Box>
                    </>
                )}
            </Container>
        </Box>
    );
};

export default Requests;