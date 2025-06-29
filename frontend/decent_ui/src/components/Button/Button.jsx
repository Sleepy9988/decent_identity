//import { useState } from 'react';
import { signInWithEthereum } from '../../helper';
import { SiweMessage } from 'siwe';

const CreateIdentityButton = () => {
    //const [did, setDID] = useState(null);

  const handleCreateIdentity = async () => {
    signInWithEthereum();
  };

  return (
    <div>
        <button onClick={handleCreateIdentity}>Create New Digital Identity</button>
 
    </div>
    );
};

export default CreateIdentityButton;