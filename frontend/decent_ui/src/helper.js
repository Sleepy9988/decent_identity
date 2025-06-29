import { ethers } from 'ethers';
import { SiweMessage } from 'siwe';

//const scheme = window.location.protocol.slice(0, -1);
//const domain = window.location.host;
//const origin = window.location.origin;
const provider = new ethers.BrowserProvider(window.ethereum);

async function connectWallet () {
    if (!window.ethereum) throw new Error('MetaMask not found!');
    try {
        await provider.send('eth_requestAccounts', [])
    } catch (err) {
        throw new Error('User rejected the request', err);
    }
}


export const signInWithEthereum = async () => {
    try {
        await connectWallet();
        
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const network = await provider.getNetwork();
        const chainId = Number(network.chainId);


        const challengeRes = await fetch('http://localhost:8000/api/auth/challenge', {
            credentials: 'include',
        });

        const { nonce } = await challengeRes.json();
        if (!nonce) throw new Error('Could not get challenge from server.');

        const siweMessage = new SiweMessage({
            domain: 'http://' + window.location.host,
            address,
            statement: 'Sign in with Ethereum.',
            uri: window.location.origin,
            version: '1',
            chainId,
            nonce
        });
    
        const messageToSign = siweMessage.prepareMessage();
       
        const signature = await signer.signMessage(messageToSign);

        const did = `did:ethr:${address}`;

        const verifyRes = await fetch('http://localhost:8000/api/auth/verify', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}, 
            credentials: 'include',
            body: JSON.stringify({
                message: messageToSign, 
                signature, 
                did
            }),
        });

        const result = await verifyRes.json();
        if (!verifyRes.ok) throw new Error(result.error || 'Verification failed.');

        console.log('Success. Logged in!');
        alert('Successfully signed in!');
        localStorage.setItem('authToken', result.access);
        
    } catch (err) {
        console.error('Siwe error:', err);
        alert(`Login failed: ${err.message}`);
    }
}