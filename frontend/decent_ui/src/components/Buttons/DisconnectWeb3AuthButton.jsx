import React from "react";
import { useAgent } from '../../services/AgentContext';
import Button from '@mui/material/Button';
import LogoutIcon from '@mui/icons-material/Logout';

/**
 * DisconnectWeb3AuthButton
 * 
 * Simple button component that triggers the global handleLogout method
 * from the AgentContext. Terminates the current Web3Auth session
 * and clear user stare from context. 
 */

const DisconnectWeb3AuthButton = () => {
    const { handleLogout } = useAgent();

    return (
        <Button 
            variant="outlined"  
            startIcon={<LogoutIcon />}
            color="error"
            size="large"
            onClick={handleLogout} 
        >
            Disconnect
        </Button>
    )
};

export default DisconnectWeb3AuthButton;