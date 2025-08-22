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


export const generateIdentityCredential = async ({ agent, did, signature, payload}) => {
    const token = localStorage.getItem('accessToken');
    const { context, description, subject = {} } = payload || {};

    const issuanceDate = new Date().toISOString();
    const expiracyDate = new Date(Date.now() + 30*24*60*60*1000).toISOString();

    const vc_identity = await agent.createVerifiableCredential({
        credential: {
            '@context': ["https://www.w3.org/ns/credentials/v2"],
            type: ['VerifiableCredential', 'IdentityCredential'],
            issuer: { id: did },
            issuanceDate: issuanceDate,
            expirationDate: expiracyDate,
            credentialSubject: {
                id: did,
                context,
                description,
                ...subject,
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
            'Authorization': `Bearer ${token}`, 
         },
        credentials: 'include',
        body: JSON.stringify({ 
            credential: vc_identity,
            signature
        }),
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

    return {accessToken: result.access, did, creation: result.profile_created, access: result.profile_last_access};
}


export const getIdentities = async (signature) => {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(
        `http://localhost:8000/api/me/identities/`,
        { 
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
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

    return data;
};

export const deleteIdentities = async (ids) => {
    const token = localStorage.getItem('accessToken');
    if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error('No identity provided.');
    }
    try {
        const response = await fetch(`http://localhost:8000/api/identity/delete/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ ids }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Error deleting identities');
        }
        return data;
    } catch (err) {
        console.error('Failed to delete identities:', err);
        throw err;
    }
};

export const updateIdentity = async(identity_id, is_active) => {
    const token = localStorage.getItem('accessToken');
    
    try {
        const response = await fetch(`http://localhost:8000/api/me/identity/${encodeURIComponent(identity_id)}/active/`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ is_active }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Error changing identity visibility');
        }
        return data;
    } catch (err) {
        console.error('Failed to change identity:', err);
        throw err;
    }
}


export const getContexts = async (did) => {
    const token = localStorage.getItem('accessToken');
    
    if (!did) throw new Error('Missing DID');
    const didStr = String(did);
    const encDid = encodeURIComponent(didStr);

    try {
        const response = await fetch(`http://localhost:8000/api/users/${encDid}/contexts/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Error obtaining contexts');
        }
        return data;
    } catch (err) {
        console.error('Failed to fetch contexts', err);
        throw err;
    }
};


export const postRequest = async ({did, agent, holderDid, contextId, purpose}) => {
    const token = localStorage.getItem('accessToken');
    const signature = localStorage.getItem('signature');

    const challengeResponse = await fetch(
        'http://localhost:8000/api/requests/challenge', 
        {credentials: 'include'}
    );
    
    const { challenge } = await challengeResponse.json();
    
    const issuanceDate = new Date().toISOString();

    const vc_request = await agent.createVerifiableCredential({
        credential: {
            '@context': ["https://www.w3.org/ns/credentials/v2"],
            type: ['VerifiableCredential', 'RequestCredential'],
            issuer: { id: did },
            issuanceDate,
            credentialSubject: {
                requestorDid: did,
                holderDid,
                contextId,
                purpose,
                requestorSignature: signature,
            },
        },
        proofFormat: 'EthereumEip712Signature2021',
    });

    // Create Verifiable Presentation, sign with EIP-712
    const presentation = await agent.createVerifiablePresentation({
        presentation: {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiablePresentation'],
            holder: did, 
            issuanceDate: new Date().toISOString(),
            verifiableCredential: [vc_request],
            challenge,
        },
        proofFormat: 'EthereumEip712Signature2021',
    });

    // Send VP and challenge to the backend for verification and authentication
    const createResponse = await fetch('http://localhost:8000/api/request/create', {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ presentation, challenge })
    });

    const result = await createResponse.json()

    if (!createResponse.ok) {
        throw new Error(result.error || 'Failed to create request.');
    }
    return result;
}


export const getRequests = async () => {
    const token = localStorage.getItem('accessToken');

    try {
        const response = await fetch(`http://localhost:8000/api/me/requests/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Error obtaining requests');
        }
        return data;
    } catch (err) {
        console.error('Failed to fetch requests', err);
        throw err;
    }
};


export const updateRequest = async ({ request_id, updates }) => {
    const token = localStorage.getItem('accessToken');
    
    const encReq = encodeURIComponent(request_id)
    try {
        const response = await fetch(`http://localhost:8000/api/requests/update/${encReq}/`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(updates)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Request could not be updated');
        }
        return data;

    } catch (err) {
        console.error('Failed to fetch contexts', err);
        throw err;
    }
}

export const deleteRequest = async({ request_id }) => {
    const token = localStorage.getItem('accessToken');
    const encReq = encodeURIComponent(request_id)
    try {
        const response = await fetch(`http://localhost:8000/api/me/request/delete/${encReq}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });

        if (response.status === 204) {
            return { success: true };
        }

        if (!response.ok) {
            throw new Error('Request could not be deleted');
        }
    } catch (err) {
        console.error('Failed to delete request', err);
        throw err;
    }
}

export const accessApprovedData = async({ request_id, signature }) => {
    const token = localStorage.getItem('accessToken');
    const encReq = encodeURIComponent(request_id);

    try {
        const response = await fetch(`http://localhost:8000/api/shared-data/${encReq}/`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ signature }),
    });
        const result = await response.json()

        if (!response.ok) {
            throw new Error(result.error || 'Failed to create request.');
        }
        return result;

    } catch (err) {
        console.error('Failed to retrieve data');
        throw err;
    }
}