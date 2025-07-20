// Import libraries
import { createResolver } from '../agent'; // frontend veramo agent
import { ethers, /*hashMessage*/ } from 'ethers'; // interactions with Ethereum
//import { recoverPublicKey } from '@ethersproject/signing-key';  // Obtain the public key of the wallet
import { EthrDID } from 'ethr-did'; // Interactions with Ethereum DIDs

/*
    Function to connect users via MetaMask wallet, generate VP, and send it 
    to the backend for verification
*/

/*
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

    const isAnchored = await checkDidOnChain(agent, did);

    console.log(isAnchored);

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
/*
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

*/


export async function checkDidOnChain (did) {
    try {
        const resolver = createResolver();
        const result = await resolver.resolve(did);
        const doc = result.didDocument;
        console.log(result, doc)
        if ( doc?.id ) {
            console.log('DID is anchored and resolvable:', doc.id);
            return true;
        } else {
            console.warn('DID Document has no ID');
            return false;
        }
    } catch (err) {
        console.warn('DID not anchored on chain:', err.message);
        return false;
    }
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

/*
export const checkDIDProfile = async ({ signer, provider, publicKeyHex, address }) => {
    // Get network, address and network name 
    const network = await provider.getNetwork();
    //const address = await signer.getAddress();
    const networkName = network.name === 'homestead' ? 'mainnet' : network.name;

    // Construct a DID based on network and address
    const did = `did:ethr:${networkName}:${address}`;
    console.log('DID: ', did);
    //const encodedDID = encodeURIComponent(did)

    /*
    const checkDIDexists = await fetch(
        `http://localhost:8000/api/did/${encodedDID}/exists`,
        { credentials: 'include' }
    );

    const { exists } = await checkDIDexists.json();

    console.log('DID profile exists?', exists);

    /*
    if (exists) {
        console.log('Profile linked to this DID already exists.');
        return did;
    }
 

    // Request and extract challenge (nonce) from the backend (to prevent replay attacks)
    const challengeResponse = await fetch(
        'http://localhost:8000/api/authentication/challenge', 
        {credentials: 'include'});
    
    const { challenge } = await challengeResponse.json();

    console.log('Obtained challenge', challenge);

    const agent = await createVeramoAgent(signer, provider, publicKeyHex);
    
    // Create Verifiable Presentation, sign with EIP-712
    const presentation = await agent.createVerifiablePresentation({
        presentation: {
            holder: did,
            //verifiableCredential: [credential],
        },
        challenge,
        proofFormat: 'EthereumEip712Signature2021',
    });

    console.log('Created VP', presentation);

    // Send VP and challenge to the backend for verification and authentication
    const createResponse = await fetch('http://localhost:8000/api/authenticate', {
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

    // Store access token in localStorage
    localStorage.setItem('authToken', result.access);

    return did;
}
*/

export const generateIdentityCredential = async ({ agent, did, accessToken }) => {
     const vc_identity = await agent.createVerifiableCredential({
        credential: {
            '@context': ["https://www.w3.org/ns/credentials/v2"],
            type: ['VerifiableCredential', 'IdentityCredential'],
            issuer: { id: did },
            issuanceDate: "2025-07-16T10:00:00Z",
            expirationDate: "2025-08-16T10:00:00Z",
            credentialSubject: {
                id: did,
                "name": "Bob",
                "email": "bob@example.com"
            },
        },
        proofFormat: 'EthereumEip712Signature2021',
    });
    console.log(vc_identity);

    // Send VP and challenge to the backend for verification and authentication
    const createResponse = await fetch('http://localhost:8000/api/credential/verify', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`, 
         },
        credentials: 'include',
        body: JSON.stringify({ credential: vc_identity })
    });

    const result = await createResponse.json()

    if (!createResponse.ok) {
        throw new Error(result.error || 'Failed to post Identity Credential.');
    }

    console.log('Identity Credential created!', result);

    return vc_identity;
}

/*

export const connectMetaMask = async () => {
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

    await checkDIDProfile({ signer, provider, publicKeyHex });

    console.log('MetaMask DID ensured!');
} 
*/

export const checkDIDProfile = async ({ agent, did }) => {
    
    // Request and extract challenge (nonce) from the backend (to prevent replay attacks)
    const challengeResponse = await fetch(
        'http://localhost:8000/api/authentication/challenge', 
        {credentials: 'include'});
    
    const { challenge } = await challengeResponse.json();

    console.log('Obtained challenge', challenge);
    
    // Create Verifiable Presentation, sign with EIP-712
    const presentation = await agent.createVerifiablePresentation({
        presentation: {
            holder: did,
        },
        challenge,
        proofFormat: 'EthereumEip712Signature2021',
    });

    console.log('Created VP', presentation);

    // Send VP and challenge to the backend for verification and authentication
    const createResponse = await fetch('http://localhost:8000/api/authenticate', {
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

    const accessToken = result.access;
    localStorage.setItem('accessToken', accessToken);

    // Store access & refresh tokens in localStorage
    localStorage.setItem('authToken', result.access);
    localStorage.setItem('refreshToken', result.refresh); 
    console.log('Authenticated successfully:', result);

    return did;
}