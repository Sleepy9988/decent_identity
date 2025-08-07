// Import libraries
import { createResolver } from '../services/veramo_agent'; // frontend veramo agent
import { ethers, /*hashMessage*/ } from 'ethers'; // interactions with Ethereum
//import { recoverPublicKey } from '@ethersproject/signing-key';  // Obtain the public key of the wallet
import { EthrDID } from 'ethr-did'; // Interactions with Ethereum DIDs

//not actively used --> refactor if necessary

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


export const generateIdentityCredential = async ({ agent, did, accessToken, signature}) => {
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
        body: JSON.stringify({ 
            credential: vc_identity,
            signature
        })
    });

    const result = await createResponse.json();
    console.log(result);

    if (!createResponse.ok) {
        throw new Error(result.error || 'Failed to post Identity Credential.');
    }

    console.log('Identity Credential created!', result);

    return vc_identity;
}


export const checkDIDProfile = async ({ agent, did }) => {
    // Request and extract challenge (nonce) from the backend (to prevent replay attacks)
    const challengeResponse = await fetch(
        'http://localhost:8000/api/authentication/challenge', 
        {credentials: 'include'}
    );
    
    const { challenge } = await challengeResponse.json();

    const rawPresentation = {
        holder: did,
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiablePresentation'],
        issuanceDate: new Date().toISOString(),
        challenge
    };

    // Create Verifiable Presentation, sign with EIP-712
    const presentation = await agent.createVerifiablePresentation({
        presentation: rawPresentation,
        proofFormat: 'EthereumEip712Signature2021',
    });

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

    // Store access & refresh tokens in localStorage
    localStorage.setItem('accessToken', result.access);
    localStorage.setItem('refreshToken', result.refresh); 

    return {accessToken: result.access, did};
}


export const getIdentities = async (accessToken, signature) => {

    const response = await fetch(
        `http://localhost:8000/api/me/identities/`,
        { 
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': `application/json`,
            },
            credentials: 'include',
            body: JSON.stringify({ signature })
        }
    );

    const data = await response.json();

    if (!response.ok) {
        console.error('Failed to fetch identities', data);
        throw new Error(data.detail || 'Error fetching identities')
    }

    //console.log('Fetched identities:', data);
    return data;
}