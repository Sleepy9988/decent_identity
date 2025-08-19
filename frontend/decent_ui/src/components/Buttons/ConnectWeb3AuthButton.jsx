import React from "react";
import { useWeb3AuthConnect } from "@web3auth/modal/react";
import { handleWeb3AuthLogin } from "../../utils/web3Login";
import { useAgent } from '../../services/AgentContext';
import { getIdentities } from '../helper';
import Button from '@mui/material/Button';
import LoginIcon from '@mui/icons-material/Login';
import { useNavigate } from "react-router-dom";

const ConnectWeb3AuthButton = () => {
    const { setAgent, setDid, setIdentity, setSignature, setMeta } = useAgent();
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
                    const result  = await handleWeb3AuthLogin(web3authProvider, setAgent);
                    if (result) {
                        const { authenticatedDid, signature, meta_data } = result;
                        
                        setDid(authenticatedDid);
                        setSignature(signature);
                        
                        const ids = await getIdentities(signature);
                        setIdentity(ids.identities);
                        
                        setMeta(meta_data);
                        
                        navigate('/dashboard');
                    }
                }
            }}
        >
            Login
        </Button>
    );
}

export default ConnectWeb3AuthButton;