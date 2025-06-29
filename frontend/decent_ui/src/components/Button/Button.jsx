
import { useState } from 'react';
import { connectDIDwithProfile } from '../helper';

const CreateIdentityButton = () => {
    const [did, setDID] = useState(null);

  const handleCreateIdentity = async () => {

   try {
        const did = await connectDIDwithProfile();
        setDID(did);
   } catch (err) {
    console.error('Error creating DID:', err);
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