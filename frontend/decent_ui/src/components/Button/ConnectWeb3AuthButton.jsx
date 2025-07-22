import React from "react";
import { useWeb3AuthConnect } from "@web3auth/modal/react";
import { handleWeb3AuthLogin } from "../../identity";
import { useAgent } from '../../AgentContext';
import { getCredentials } from '../helper';

import './Button.css';

const ConnectWeb3AuthButton = () => {
    const { setAgent, setDid, setAccessToken } = useAgent();
    const { connect, isConnected  } = useWeb3AuthConnect();

    if (isConnected) {
        return null;
    }

    return (
        <button 
            className="button-primary"
            onClick={async () => {
                const web3authProvider = await connect();
                if (web3authProvider) {
                    const result  = await handleWeb3AuthLogin(web3authProvider, setAgent, setDid, setAccessToken);
                    if (result) {
                        const { authenticatedDid, accessToken } = result;
                        setDid(authenticatedDid);
                        await getCredentials(accessToken);
                    }
                }
            }}
        >
            Login with Web3Auth
        </button>
    );
}

export default ConnectWeb3AuthButton;