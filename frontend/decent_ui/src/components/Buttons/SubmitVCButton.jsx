import React, { useState } from "react";
import { generateIdentityCredential, getIdentities } from "../../utils/apiHelper";
import { useAgent } from '../../services/AgentContext';
import { useWeb3Auth } from "@web3auth/modal/react";
import Button from '@mui/material/Button';
import CreateIcon from '@mui/icons-material/Create';
import { ensureAgentDid } from "../../utils/buildVeramoAgent";

/**
 * SubmitVCButton
 * 
 * Button that creates and submits a Verifiable Credential (VC).
 * - Ensures agent & DID are available.
 * - Calls API to generate credential.
 * - Refreshes identities and clears avatar file. 
 * - Hands back success & error messages through props. 
 */

const SubmitVCButton = ({ payload, onSuccess, avatarFile, setAvatarFile, setOpen, setMessage, setAlertType }) => {
    const { provider, connect } = useWeb3Auth();
    const { agent, did, signature, setIdentity, setAgent, setDid } = useAgent();
    const [pending, setPending] = useState(false); 
    
    // Create VC, refresh state and update UI.
    const handleClick = async () => {
        setPending(true);
        try {
            const { agent: liveAgent, did: liveDid } = await ensureAgentDid({
                agent, 
                did, 
                provider, 
                connect,
                setAgent, 
                setDid
            });
            
            const sig = signature || localStorage.getItem('signature');
            if (!sig) {
                throw new Error('Missing signature for encryption/decryption');
            }
            if (!provider) {
                setAlertType('warning');
                setMessage('Wallet is not connected.');
                setOpen(true);
                return;
            }
            await generateIdentityCredential({ 
                agent: liveAgent, 
                did: liveDid, 
                signature: sig, 
                payload, 
                avatarFile 
            });

            if (typeof onSuccess === "function") onSuccess();

            const refreshed = await getIdentities(sig);
            setIdentity(refreshed.identities);
            setAvatarFile(null);

            setMessage('Credential created successfully!');
            setAlertType('success');
            setOpen(true);

        } catch (e) {
            console.error(e);
            setMessage('Failed to create credential.');
            setAlertType('error');
            setOpen(true);
        } finally {
            setPending(false);
        }
    };

    return (
        <Button variant="outlined" endIcon={<CreateIcon />} onClick={handleClick} color="success" size="large">
            {pending ? "Creating..." : "Create"}
        </Button>
    );
}

export default SubmitVCButton;