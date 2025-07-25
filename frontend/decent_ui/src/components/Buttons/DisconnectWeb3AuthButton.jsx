import React from "react";
import { useWeb3AuthConnect, useWeb3AuthDisconnect } from "@web3auth/modal/react";
import { useAgent } from '../../services/AgentContext';
import { logoutUser } from '../../utils/logoutUser';
import Button from '@mui/material/Button';
import LogoutIcon from '@mui/icons-material/Logout';


const DisconnectWeb3AuthButton = () => {
    const { isConnected } = useWeb3AuthConnect();
    const { disconnect } = useWeb3AuthDisconnect();
    const { setAgent, setDid, setAccessToken } = useAgent();

     const handleLogout = () => {
            logoutUser({ setAgent, setDid, setAccessToken, disconnect });
        }

    if (isConnected) {
        return (
            <Button 
                variant="outlined"  
                startIcon={<LogoutIcon />}
                color="error"
                size="large"
                onClick={() => handleLogout()} 
            >
                Disconnect
            </Button>
        )
    }
    return null;
};

export default DisconnectWeb3AuthButton;