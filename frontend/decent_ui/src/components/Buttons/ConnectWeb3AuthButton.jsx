import React from "react";
import { useWeb3AuthConnect } from "@web3auth/modal/react";
import { handleWeb3AuthLogin } from "../../utils/web3Login";
import { useAgent } from '../../services/AgentContext';
import { getIdentities } from '../helper';
import Button from '@mui/material/Button';
import LoginIcon from '@mui/icons-material/Login';
import { useNavigate } from "react-router-dom";

const ConnectWeb3AuthButton = () => {
    const { setAgent, setDid, setAccessToken, setIdentity, setSignature } = useAgent();
    const { connect, isConnected  } = useWeb3AuthConnect();
    const navigate = useNavigate();

    if (isConnected) return null;

    return (
        <Button 
            variant="contained" 
            startIcon={<LoginIcon />}
            size="large"
            sx={{ p: 2}}
            onClick={async () => {
                const web3authProvider = await connect();
                if (web3authProvider) {
                    const result  = await handleWeb3AuthLogin(web3authProvider, setAgent, setDid, setAccessToken, setSignature);
                    if (result) {
                        const { authenticatedDid, accessToken, signature } = result;
                        setDid(authenticatedDid);
                        setSignature(signature);
                        const ids = await getIdentities(accessToken, signature);
                        setIdentity(ids.identities);
                        navigate('/dashboard');
                    }
                }
            }}
        >
            Login with Web3Auth
        </Button>
    );
}

export default ConnectWeb3AuthButton;