import { ethers } from 'ethers';
import VeramoAgentWrapper from '../services/veramo_agent';

/**
 * buildVeramoFromWeb3Provider
 * 
 * Factory function to create and initialize a Veramo agent wrapper
 * using an external Web3Auth provider 
 * 
 * Steps: 
 * 1. Wraps the injected provider in an Ethers.js BrowserProvider
 * 2. Extracts the signer (used for signing / verifying with the wallet)
 * 3. Creates a VeramoAgentWrapper instance with provider, signer, and optional public key. 
 * 4. Calls init() on the wrapper to prepare the agent (load plugins, configure DID, etc.)
 * 
 * Params: 
 * - web3authProvider: Provider from Web3Auth
 * - publicKeyHex: hex-encoded public key string, defaults to '' if not provided. 
 * 
 * Returns:
 * - An initialized VeramoAgentWrapper ready for DID/VC operations. 
 */

export async function buildVeramoFromWeb3Provider(web3authProvider, publicKeyHex) {
    if (!web3authProvider) throw new Error('No wallet provider passed to buildVeramoFromWeb3Provider');
    // Create ethers.js provider from Web3Auth provider
    const ethersProvider = new ethers.BrowserProvider(web3authProvider);
    
    // Extract wallet signer (used for signing credentials and messages)
    const signer = await ethersProvider.getSigner();

    // Initialize Veramo agent wrapper with provider, signer, and public key
    const wrapper = new VeramoAgentWrapper(ethersProvider, signer, publicKeyHex || '' );
    await wrapper.init();
    
    return wrapper;
}


// Rebuild agent & DID if missing, using a provider
export async function ensureAgentDid({agent, did, provider, connect, setAgent, setDid, publicKeyHex}) {
    if (agent && did) return { agent, did}
    
    let liveProvider = provider;
    if (!liveProvider && typeof connect === 'function') {
        try {
            const maybeProvider = await connect();
            liveProvider = maybeProvider || liveProvider;
        } catch {
            // do nothing
        }
    }
    if (!liveProvider) {
        throw new Error('Wallet provider not connected. Please log in again.');
    }

    const storedPK = publicKeyHex ?? localStorage.getItem('publicKeyHex') ?? '';
    const wrapper = await buildVeramoFromWeb3Provider(liveProvider, storedPK);
    
    const newAgent = wrapper.getAgent();
    const newDid = wrapper.getDID();
    
    setAgent(newAgent);
    setDid(newDid);

    return { agent: newAgent, did: newDid };
};