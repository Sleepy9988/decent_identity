import { createVeramoAgent } from '../agent';
import { ethers, hashMessage } from 'ethers';
import { recoverPublicKey } from '@ethersproject/signing-key';

export const connectDIDwithProfile = async () => {
    if (!window.ethereum) throw new Error("MetaMask not found!");
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    
    const message = 'public key extraction';
    const signature = await signer.signMessage(message);
    const digest = hashMessage(message);
    const publicKey = recoverPublicKey(digest, signature);
    const publicKeyHex = publicKey.slice(4);
    

    const network = await provider.getNetwork();
    const address = await signer.getAddress();
    const chainId = network.chainId;
    console.log(chainId);
    const networkName = network.name === 'homestead' ? 'mainnet' : network.name;

    const did = `did:ethr:${networkName}:${address}`;

    console.log("User DID:", did);


    const agent = await createVeramoAgent(signer, provider, publicKeyHex); 


    const challengeResponse = await fetch('http://localhost:8000/api/registration/challenge');
    const { challenge } = await challengeResponse.json();

/*
    const credential = await agent.createVerifiableCredential({
        credential: {
            issuer: { id: did },
            type: ['VerifiableCredential'],
            credentialSubject: {
                id: did, 
                name: "Test User",
            },
        },
        proofFormat: 'EthereumEip712Signature2021',
});
*/

    const presentation = await agent.createVerifiablePresentation({
        presentation: {
            holder: did,
            //verifiableCredential: [credential],
        },
        challenge,
        proofFormat: 'EthereumEip712Signature2021',

    });
    console.log("Presentation created successfully!");

    const createResponse = await fetch('http://localhost:8000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ presentation, challenge })
    });

    const result = await createResponse.json()

    if (!createResponse.ok) {
        throw new Error(result.error || 'Failed to create profile.');
    }

    console.log('Profile created and/or user logged in!', result);
    alert('Successfully signed in!');

    localStorage.setItem('authToken', result.access);
   
    console.log(`Profile created for user ${result.userID}.`);
        
}
