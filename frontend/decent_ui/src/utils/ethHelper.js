import { createResolver } from '../services/veramo_agent'; 
import { ethers } from 'ethers'; 
import { EthrDID } from 'ethr-did'; 

/**
 * checkDidOnChain
 * 
 * Resolves a DID document on-chain to verify its existence.
 * - Uses Veramo's DID resolver (createResolver)
 * - Returns true if a valid DID document with an ID is found, otherwise false.
 * 
 * Params: 
 * - did: string, the DID to resolve
 * 
 * Returns: 
 * - boolean, whether the DID is anchored. 
 */

export async function checkDidOnChain (did) {
    try {
        const resolver = createResolver();
        const result = await resolver.resolve(did);
        const doc = result.didDocument;
        return Boolean(doc.id);
    } catch {
        return false;
    }
}

/**
 * anchorDid (not currently exposed anywhere in the application)
 * 
 * Anchors a new DID attribute on the Ethereum Sepolia testnet. 
 * - Connects to MetaMask via provider 
 * - Uses ethers.js BrowserProvider and Signer to interact with blockchain
 * - Creates an EthrDID instance tied to the current account. 
 * - Calls setAttribute to publish a DID service endpoint (linked-domain).
 * 
 */
export async function anchorDid() {
    if (!window.ethereum) throw new Error("MetaMask not found!");
    
    // Setup provider and signer from MetaMask
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();    

    const network = await provider.getNetwork();
    const address = await signer.getAddress();
 
    // Create EthrDID instance bound to current wallet
    const ethrDid = new EthrDID({
        identifier: address, 
        provider, 
        chainNameOrId: network.chainId,
        txSigner: signer,
        registry: '0x03d5003bf0e79C5F5223588F347ebA39AfbC3818'
    });

    // Publish a DID service attribute to chain
    const tx = await ethrDid.setAttribute(
        'did/svc/linked-domain', // Attribute type
        'https://example.com', // Value of the attribute
        86400 // Validity in seconds (here 1 day)
    );

    console.log('DID anchored with transaction:', tx.hash);
}