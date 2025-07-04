
import { useState } from 'react';
import './Button.css';
import { connectWithMetaMask, anchorDid } from '../helper';

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
    </div>
    );
};

export default CreateIdentityButton;