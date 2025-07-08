import React from "react";
import { useWeb3AuthConnect } from "@web3auth/modal/react";
import { handleWeb3AuthLogin } from "../../identity";

//import { useState } from 'react';
import './Button.css';
//import { connectWithMetaMask, anchorDid, checkDidOnChain } from '../helper';

export default function LoginButton({ onDIDResolved }) {
    const { connect } = useWeb3AuthConnect();

    return (
        <button 
            onClick={async () => {
                const web3authProvider = await connect();
                if (web3authProvider) {
                    const resolvedDID = await handleWeb3AuthLogin(web3authProvider);
                    onDIDResolved(resolvedDID);
                }
            }}
        >
            Login with Web3Auth
        </button>
    );
}

/*
const CreateIdentityButton = () => {
    const [did, setDID] = useState(null);

  const handleCreateIdentity = async () => {

   try {
        const did = await connectWithMetaMask();
        setDID(did);
   } catch (err) {
    console.error('Error creating DID:', err);
   }
  };

  const writeToSepolia = async () => {
   try {
       anchorDid();
   } catch (err) {
    console.error('Error creating DID:', err);
   }
  };

  return (
    <div>
        <button className="button-primary" onClick={handleCreateIdentity}>Connect with MetaMask</button>
        {did && <p>Your DID is: <strong>{did}</strong></p>}
        <button onClick={writeToSepolia}>Anchor DID</button>
        <button onClick={checkDidOnChain}>Check DID</button>
    </div>
    );
};

//export default CreateIdentityButton;
*/
