import { createResolver } from '../services/veramo_agent'; 
import { ethers } from 'ethers'; 
import { EthrDID } from 'ethr-did'; 

export async function checkDidOnChain (did) {
    try {
        const resolver = createResolver();
        const result = await resolver.resolve(did);
        const doc = result.didDocument;
        return Boolean(doc?.id);
    } catch {
        return false;
    }
}

/*
    Function to anchor a DID on the Etherum Sepolia test chain.
    
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