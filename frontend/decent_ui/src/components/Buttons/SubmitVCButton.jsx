import React, { useState } from "react";
import { generateIdentityCredential, getIdentities } from "../../utils/apiHelper";
import { useAgent } from '../../services/AgentContext';
import { useWeb3Auth } from "@web3auth/modal/react";
import Button from '@mui/material/Button';
import CreateIcon from '@mui/icons-material/Create';
import { buildVeramoFromWeb3Provider } from "../../utils/buildVeramoAgent";

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
    const { web3Auth } = useWeb3Auth();
    const { agent, did, signature, setIdentity, setAgent,setDid } = useAgent();

    const [pending, setPending] = useState(false);

    // Ensure there is a valid agent & DID, rebuild from provider is necessary.
    const ensureAgentDid = async () => {
        if (agent && did) {
            return { agent, did}
        }
        const provider = web3Auth.provider;
        if (!provider) {
            throw new Error('Wallet provider not connected. Please log in again.');
        }

        const storedPK = localStorage.getItem('publicKeyHex') || '';
        const wrapper = await buildVeramoFromWeb3Provider(provider, storedPK);
        
        const rebuildAgent = wrapper.getAgent();
        const rebuildDid = wrapper.getDID();
        setAgent(rebuildAgent);
        setDid(rebuildDid);

        return { agent: rebuildAgent, did: rebuildDid };
    };
    
    // Create VC, refresh state and update UI.
    const handleClick = async () => {
        setPending(true);
        try {
            const { agent: a, did: d } = await ensureAgentDid();
            
            const sig = signature || localStorage.getItem('signature');
            if(!sig) {
                throw new Error('Missing signature for encryption/decryption');
            }
        
            await generateIdentityCredential({ agent: a, did: d, signature: sig, payload, avatarFile });

            if (typeof onSuccess === "function") onSuccess();

            const refreshed = await getIdentities(signature);
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