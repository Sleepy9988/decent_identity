import React from "react";
import { useAgent } from '../../services/AgentContext';
import Button from '@mui/material/Button';
import LogoutIcon from '@mui/icons-material/Logout';


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