import React, { useState } from "react";
import { useWeb3AuthConnect } from "@web3auth/modal/react";
import { useWeb3Auth } from "@web3auth/modal/react";
import { handleWeb3AuthLogin } from "../../utils/web3Login";
import { useAgent } from '../../services/AgentContext';
import { getIdentities } from "../../utils/apiHelper";
import { Button } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import { useNavigate } from "react-router-dom";

/**
 *  ConnectWeb3AuthButton Component
 *
 *  Button component that triggers the Web3Auth login flow and passes the result 
 *  into the global Agent context. 
 *  On Success redirects the user to the Dashboard. 
 */
const ConnectWeb3AuthButton = () => {
    const [loading, setLoading] = useState(false);

    const { setAgent, setDid, setIdentity, setSignature, setMeta } = useAgent();
    const { connect } = useWeb3AuthConnect();
    const { status, provider } = useWeb3Auth();

    const navigate = useNavigate();

    /**
     * Flow:
     * 1. Ensure Web3Auth provider exists (connect if not).
     * 2. Call login handler to get agent, DID, signature and meta data
     * 3. Fetch identities linked to the signature and store in context.
     * 4. Navigate to the Dashboard.
     */

    const handleClick = async () => {
        // Prevent double submission
        if (loading) return;
        setLoading(true);

        try {
            let web3authProvider = provider;
            // if not connected, initiate the Web3Auth connection modal.
            if (status !== 'connected') {
                web3authProvider = await connect();
            }
            // in case connect() does not work.
            if (!web3authProvider) {
                throw new Error('Provider not available');
            }

            // Call Login handler to perform authentication and get session data.
            const result  = await handleWeb3AuthLogin(web3authProvider);
            if (result) {
                const { authenticatedDid, signature, meta_data, agent } = result;
                
                // Persist in global context used throughou the app.
                setAgent(agent);
                setDid(authenticatedDid);
                setSignature(signature);
                
                // Fetch user identities using the signature. 
                const ids = await getIdentities(signature);
                setIdentity(ids.identities);
                // Store additional meta data.
                setMeta(meta_data);
                // Navigate to dashboard
                navigate('/dashboard');
            }   
        } catch (err) {
            console.error("Login error:", err);
        } finally {
            setLoading(false);
        }
    }
    
    return (
        <Button 
            variant="contained" 
            startIcon={<LoginIcon />}
            size="large"
            sx={{
                px: { xs: 2, sm: 3 },
                py: { xs: 1.25, sm: 2 },
                width: { xs: '100%', sm: 'auto' }
            }}
            onClick={handleClick}
            disabled={loading}
        >
            {loading ? "Logging in..." : "Login"}
        </Button>
    );
}

export default ConnectWeb3AuthButton;