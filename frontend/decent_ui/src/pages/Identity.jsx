import React, { useState } from 'react';
import IdentityForm from '../components/Forms/IdentityForm';
import CardList from '../components/Cards/CardList';
import { Box, Container, Typography, Divider, Collapse, Fab, Tooltip, Pagination } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { useAgent } from '../services/AgentContext';

/**
 * Identity
 * 
 * Page for managing user identities.
 * Displays:
 * - Header with page title and FAB to toggle the identity creation form. 
 * - Collapsible section with IdentityForm to create new identities.
 * - Paginated list of identities, rendered via CardList
 */

const Identity = () => {
    const [checked, setChecked] = useState(false);
    const { id } = useAgent();

    const [currentPage, setCurrentPage] = useState(1);
    const cardsPerPage = 3; 

    const handleChange = () => {
        setChecked((prev) => !prev);
    }

    // Calculate current page slice
    const idxLastCard = currentPage * cardsPerPage;
    const idxFirstCard = idxLastCard - cardsPerPage;
    const currentCards = id.slice(idxFirstCard, idxLastCard);

    return (
        <Box>
            {/* Page Header + toggle button */}
            <Box component='section' sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', flexDirection: { xs:'column', sm:'row' }, alignItems:{ xs:'flex-start', sm:'center' }, gap:{ xs:2, sm:0 }}}>
                <Typography sx={{ typography: { xs: 'h5', sm: 'h4', md: 'h3' }}} gutterBottom align='left'>
                    Identities
                </Typography> 
                <Tooltip title='Add new Identity' placement='right' arrow slotProps={{tooltip: { sx: { fontSize: '1rem'}}}}>
                    <Fab color='primary' aria-label='add' onClick={handleChange} sx={{ alignSelf: { xs:'flex-start', sm:'auto' } }}>
                        {checked ? <CloseIcon /> : <AddIcon />}
                    </Fab>
                </Tooltip>
            </Box>
            
            {/* Identity creation form (collapsible) */}
            <Container maxWidth='xl' sx={{ display: 'flex', justifyContent: 'center' }}>
                <Collapse in={checked}>
                    <IdentityForm />
                </Collapse>
            </Container>

            <Divider />

            {/* Identities list */}
            {id && <CardList identities={currentCards} />}

            {/* Pagination controls */}
            <Box sx={{ mt: 2, mb:5, display: 'flex', justifyContent: 'center'}}>
                <Pagination
                    count={Math.ceil(id.length / cardsPerPage)}
                    page={currentPage}
                    onChange={(event, value) => setCurrentPage(value)}
                />
            </Box>
        </Box>
    );
};

export default Identity;