import React from "react";
import { generateIdentityCredential } from "../helper";
import { useAgent } from '../../services/AgentContext';

import Button from '@mui/material/Button';
import CreateIcon from '@mui/icons-material/Create';

const SubmitVCButton = ({ payload }) => {
    const { agent, did, signature } = useAgent();
    
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
            const accessToken = localStorage.getItem('accessToken');
            const res = await generateIdentityCredential({ agent, did, accessToken, signature, payload });
            console.log(res);
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