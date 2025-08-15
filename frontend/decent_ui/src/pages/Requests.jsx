import React, { useState} from 'react';

import { Container, Box, Typography, Tabs, Tab, Divider } from '@mui/material';
import RequestForm from '../components/Forms/RequestForm';

const Requests = () => {
    const [value, setValue] = useState("1");

    const handleChange = (e, newValue) => {
        setValue(newValue);
    }

    return (
        <Box>
            <Box component='section' sx={{ mt: 4, display: 'flex', justifyContent: 'space-between'}}>
                <Typography variant="h3" gutterBottom align="left">
                    Requests
                </Typography> 
            </Box>
            <Divider />
            <Container component='section' sx={{ mt: 4}}>
                <Tabs value={value} onChange={handleChange} centered>
                    <Tab label='New Request' sx={{fontSize: '1rem', mr: 5}} value="1" />
                    <Tab label='Received Requests' sx={{fontSize: '1rem', mr: 5}} value="2" />
                    <Tab label='Created Requests' sx={{fontSize: '1rem'}} value="3" />
                </Tabs>
                {value === "1" && <RequestForm />}
            </Container>
        </Box>
    );
};

export default Requests;