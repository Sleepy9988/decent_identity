// Import libraries
import { createVeramoAgent } from '../agent'; // frontend veramo agent
import { ethers, hashMessage } from 'ethers'; // interactions with Ethereum
import { recoverPublicKey } from '@ethersproject/signing-key';  // Obtain the public key of the wallet
import { EthrDID } from 'ethr-did'; // Interactions with Ethereum DIDs

/*
    Function to connect users via MetaMask wallet, generate VP, and send it 
    to the backend for verification
*/
export const connectWithMetaMask = async () => {
    // ensure MetaMask browser extension is available
    if (!window.ethereum) throw new Error("MetaMask not found!");
    
    // Initialize BrowserProvider object, connect to wallet and get signer
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    
    // Extract the public key of the MetaMask wallet
    const message = 'Public Key Extraction';
    const signature = await signer.signMessage(message);
    const digest = hashMessage(message);
    const publicKey = recoverPublicKey(digest, signature);
    const publicKeyHex = publicKey.slice(4);
    
    // Get network, address and network name 
    const network = await provider.getNetwork();
    const address = await signer.getAddress();
    const networkName = network.name === 'homestead' ? 'mainnet' : network.name;
    
    // Construct a DID based on network and address
    const did = `did:ethr:${networkName}:${address}`;
    // Create Veramo frontend agent, pass signer, provider and public key
    const agent = await createVeramoAgent(signer, provider, publicKeyHex); 

    // Request and extract challenge (nonce) from the backend (to prevent replay attacks)
    const challengeResponse = await fetch('http://localhost:8000/api/registration/challenge', {credentials: 'include'});
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
    // Create Verifiable Presentation, sign with EIP-712
    const presentation = await agent.createVerifiablePresentation({
        presentation: {
            holder: did,
            //verifiableCredential: [credential],
        },
        challenge,
        proofFormat: 'EthereumEip712Signature2021',

    });

    // Send VP and challenge to the backend for verification and authentication
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

    // Store access token in localStorage
    localStorage.setItem('authToken', result.access);
}

/*
    Function to anchor a DID on the Etherum Sepolia test chain
    The DID cannot be resolved during verification if not anchored on chain
*/
export async function anchorDid() {
    if (!window.ethereum) throw new Error("MetaMask not found!");
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();    

    const network = await provider.getNetwork();
    const address = await signer.getAddress();
 
    // Create EthrDID instance
    const ethrDid = new EthrDID({
        identifier: address, 
        provider, 
        chainNameOrId: network.chainId,
        txSigner: signer,
        registry: '0x03d5003bf0e79C5F5223588F347ebA39AfbC3818'
    });

    // set DID attribute
    const tx = await ethrDid.setAttribute(
        'did/svc/linked-domain', // Attribute type
        'https://example.com', // Value of the attribute
        86400 // Validity in seconds (here 1 day)
    );

    console.log('DID anchored with transaction:', tx.hash);
}