import React, { useState } from "react";
import { useWeb3AuthConnect } from "@web3auth/modal/react";
import { handleWeb3AuthLogin } from "../../utils/web3Login";
import { useAgent } from '../../services/AgentContext';
import { getIdentities } from '../helper';
import Button from '@mui/material/Button';
import LoginIcon from '@mui/icons-material/Login';
import { useNavigate } from "react-router-dom";

const ConnectWeb3AuthButton = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { setAgent, setDid, setIdentity, setSignature, setMeta } = useAgent();
    const { connect } = useWeb3AuthConnect();
    const navigate = useNavigate();

    const handleClick = async () => {
        setLoading(true);
        try {
            const web3authProvider = await connect();
                if (web3authProvider) {
                    const result  = await handleWeb3AuthLogin(web3authProvider);
                    if (result) {
                        const { authenticatedDid, signature, meta_data, agent } = result;
                        
                        setAgent(agent);
                        setDid(authenticatedDid);
                        setSignature(signature);
                        
                        const ids = await getIdentities(signature);
                        setIdentity(ids.identities);
                        
                        setMeta(meta_data);
                        
                        navigate('/dashboard');
                    }
                }
        } catch (err) {
            console.error("Login error:", err);
            setError("Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    }
    
    return (
        <Button 
            variant="contained" 
            startIcon={<LoginIcon />}
            size="large"
            sx={{ p: 2}}
            onClick={handleClick}
            disabled={loading}
        >
            {loading ? "Logging in..." : "Login"}
            {error && <Typography color="error">{error}</Typography>}
        </Button>
    );
}

export default ConnectWeb3AuthButton;