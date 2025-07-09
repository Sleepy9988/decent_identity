import { useWeb3AuthConnect, useWeb3AuthDisconnect } from "@web3auth/modal/react";
import React from "react";

const DisconnectWeb3AuthButton = () => {
    const { isConnected } = useWeb3AuthConnect();
    const { disconnect } = useWeb3AuthDisconnect();

    if (isConnected) {
        return (
            <button onClick={() => disconnect()} >Disconnect</button>
        )
    }
    return null;
};

export default DisconnectWeb3AuthButton;