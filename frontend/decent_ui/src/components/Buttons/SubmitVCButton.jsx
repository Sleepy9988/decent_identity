import React from "react";
import { generateIdentityCredential, getIdentities } from "../helper";
import { useAgent } from '../../services/AgentContext';

import Button from '@mui/material/Button';
import CreateIcon from '@mui/icons-material/Create';

const SubmitVCButton = ({ payload, onSuccess }) => {
    const { agent, did, signature, setIdentity } = useAgent();
    
    const handleClick = async () => {
        if (!agent || !did) {
            console.error("Agent or DID not available.");
            return;
        }
        if (!signature) {
            console.error('Missing signature for encryption/decryption.');
            return;
        }

        try {
            await generateIdentityCredential({ agent, did, signature, payload });

            if (typeof onSuccess === "function") onSuccess();

            const refreshed = await getIdentities(signature);
            setIdentity(refreshed.identities);

        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Button variant="outlined" endIcon={<CreateIcon />} onClick={handleClick} color="success" size="large">
            Create
        </Button>
    );
}

export default SubmitVCButton;