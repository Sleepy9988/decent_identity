import { ethers } from 'ethers';
import { useState } from 'react';

const CreateIdentityButton = () => {
    const [did, setDID] = useState(null);

  const handleCreateIdentity = async () => {
    let signer = null;
    let provider;

    try {
        if (window.ethereum  == null) {
            console.log("MetaMask is not installed. Please install it to create a new identity.")
            provider = ethers.getDefaultProvider()
        } else {
            provider = new  ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            signer = await provider.getSigner();

            const address = await signer.getAddress();

            const newDID = `did:ethr:${address}`;

            console.log('New DID created:', newDID);
            setDID(newDID);
        }
        
    } catch (err) {
        console.error(err);
    }
  };

  return (
    <div>
        <button onClick={handleCreateIdentity}>Create New Digital Identity</button>
        {did && <p>Your DID is: <strong>{did}</strong></p>}
    </div>
    );
};

export default CreateIdentityButton;