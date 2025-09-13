import { apiRequest } from "./apiClient";

// ----- AUTHENTICATION -----

export async function checkDIDProfile({ agent, did }) {
    // Request and extract challenge (nonce) from the backend (to prevent replay attacks)
    
    const { challenge } = await apiRequest('/auth/challenge/', { method: 'GET' });

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
    const result = await apiRequest('/auth/authenticate/', { 
        method: 'POST', 
        body: { presentation, challenge }
    });

    // Store access & refresh tokens in localStorage
    localStorage.setItem('accessToken', result.access);
    localStorage.setItem('refreshToken', result.refresh); 

    return {
        accessToken: result.access, 
        did, 
        creation: result.profile_created, 
        access: result.profile_last_access
    };
}

// ----- IDENTITIES -----

export async function generateIdentityCredential({ agent, did, signature, payload, avatarFile }) {
    const { context, description, subject = {} } = payload || {};

    const issuanceDate = new Date().toISOString();
    const expirationDate = new Date(Date.now() + 30*24*60*60*1000).toISOString();

    const vc_identity = await agent.createVerifiableCredential({
        credential: {
            '@context': ["https://www.w3.org/ns/credentials/v2"],
            type: ['VerifiableCredential', 'IdentityCredential'],
            issuer: { id: did },
            issuanceDate: issuanceDate,
            expirationDate: expirationDate,
            credentialSubject: {
                id: did,
                context,
                description,
                ...subject,
            },
        },
        proofFormat: 'EthereumEip712Signature2021',
    });

    const formData = new FormData();
    formData.append('credential', JSON.stringify(vc_identity));
    formData.append('signature', signature);
    if (avatarFile) formData.append('avatar', avatarFile, avatarFile.name);

    await apiRequest('/identity/', { 
        method: 'POST',
        body: formData
    });

    return vc_identity;
}


export async function getIdentities(signature) {
    return apiRequest('/me/identities/', {
        method: 'POST',
        body: { signature },
    });
}


export async function deleteIdentities(ids) {
    if (!Array.isArray(ids) || ids.length === 0) throw new Error('No identity provided.');
    return apiRequest('/me/identities/mass-delete/', {
        method: 'POST',
        body: { ids },
    });
}


export async function updateIdentity(identity_id, is_active) {
    return apiRequest(`/me/identities/${encodeURIComponent(identity_id)}/active/`, {
        method: 'PUT',
        body: { is_active },
    });
}


// ----- IDENTITY DATA / CONTEXTS -----

export async function getContexts(did) {
    if (!did) throw new Error('Missing DID');

    return apiRequest(`/users/${encodeURIComponent(String(did))}/contexts/`, {
        method: 'GET',
    });
}
    

// ----- REQUESTS -----

export async function postRequest({did, agent, holderDid, contextId, purpose}) {
    const { challenge } = await apiRequest('/requests/challenge/', { method: 'GET' });
    const issuanceDate = new Date().toISOString();
    const signature = localStorage.getItem('signature') || undefined;

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

    return apiRequest('/requests/', {
        method: 'POST',
        body: { presentation, challenge },
    });
}


export async function getRequests() {
    return apiRequest('/me/requests/', { method: 'GET' });
}


export async function updateRequest({ request_id, updates }) {
    return apiRequest(`/requests/${encodeURIComponent(request_id)}/`, {
        method: 'PATCH',
        body: updates,
    });
}
    

export async function deleteRequest({ request_id }) {
    await apiRequest(`/me/requests/${encodeURIComponent(request_id)}/`, {
        method: 'DELETE',
    });
    return { success: true };
}


// ----- APPROVED REQUESTS -----

export async function accessApprovedData({ request_id, signature }) {
    return apiRequest(`/requests/${encodeURIComponent(request_id)}/shared-data/`, {
        method: 'POST',
        body: { signature },
    });
}


export async function revokeAccessApprovedData({ request_id }) {
    await apiRequest(`/shared-data/${encodeURIComponent(request_id)}/`, {
        method: 'DELETE',
    });
    return { success: true }
}