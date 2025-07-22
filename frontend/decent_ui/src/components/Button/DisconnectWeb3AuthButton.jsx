import { useWeb3AuthConnect, useWeb3AuthDisconnect } from "@web3auth/modal/react";
import React from "react";
import { useAgent } from '../../AgentContext';
import { logoutUser } from '../../utils/logoutUser';


const DisconnectWeb3AuthButton = () => {
    const { isConnected } = useWeb3AuthConnect();
    const { disconnect } = useWeb3AuthDisconnect();
    const { setAgent, setDid, setAccessToken } = useAgent();

     const handleLogout = () => {
            logoutUser({ setAgent, setDid, setAccessToken, disconnect });
        }

    if (isConnected) {
        return (
            <button onClick={() => handleLogout()} >Disconnect</button>
        )
    }
    return null;
};

export default DisconnectWeb3AuthButton;