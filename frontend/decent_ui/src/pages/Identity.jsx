import React, { useState } from 'react';
import Form from '../components/Forms/IdentityForm';
import CardList from '../components/Cards/CardList';
import { Box, Container, Typography, Divider, Collapse, Fab, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

import { useAgent } from '../services/AgentContext';

const Identity = () => {
    const [checked, setChecked] = useState(false);
    const { id } = useAgent();

    const handleChange = () => {
        setChecked((prev) => !prev);
    }

    return (
        <Box>
            <Box component="section" sx={{ mt: 4, display: 'flex', justifyContent: 'space-between'}}>
                <Typography variant="h3" gutterBottom align="left">
                    Identities
                </Typography> 
                <Tooltip title='Add new Identity' placement="right" arrow slotProps={{tooltip: { sx: { fontSize: '1rem'}}}}>
                    <Fab color="primary" aria-label="add" onClick={handleChange}>
                        {checked ? <CloseIcon /> : <AddIcon />}
                    </Fab>
                </Tooltip>
            </Box>
            <Box component="section" sx={{ mt: 4}}>
                <Divider />
            </Box>
            <Container maxWidth="xl" sx={{ display: 'flex', justifyContent: 'center' }}>
                <Collapse in={checked}>
                    <Form />
                </Collapse>
            </Container>
            <Divider />
            {id && <CardList identities={id} />}
        </Box>
    );
};

export default Identity;