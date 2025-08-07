import React from "react";
import { generateIdentityCredential } from "../helper";
import { useAgent } from '../../services/AgentContext';

import './Button.css';

const SubmitVCButton = () => {
    const { agent, did, signer } = useAgent();
    
    const handleClick = async () => {
        if (!agent || !did) {
            console.error("Agent or DID not available.");
            return;
        }
        await generateIdentityCredential({ agent, did, accessToken: localStorage.getItem('accessToken'), signer });
    };

    return (
        <button className="button-primary" onClick={handleClick}>
            Create
        </button>
    );
}

export default SubmitVCButton;