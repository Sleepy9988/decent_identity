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
    // Create ethers.js provider from Web3Auth provider
    const ethersProvider = new ethers.BrowserProvider(web3authProvider);
    
    // Extract wallet signer (used for signing credentials and messages)
    const signer = await ethersProvider.getSigner();

    // Initialize Veramo agent wrapper with provider, signer, and public key
    const wrapper = new VeramoAgentWrapper(ethersProvider, signer, publicKeyHex || '' );
    await wrapper.init();
    
    return wrapper;
}