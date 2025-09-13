import { ethers, hashMessage } from "ethers";
//import { recoverPublicKey } from "@ethersproject/signing-key";
import { checkDIDProfile } from "./apiHelper";
import VeramoAgentWrapper from "../services/veramo_agent";


/**
 * handleWeb3AuthLogin
 * 
 * Handles the Web3Auth login flow and initializes the Veramo agent. 
 * 
 * Steps: 
 * 1. Creates an Ethers.js provider and signer from the Web3Auth provider. 
 * 2. Signs a static message ("DIDHub cryptographic key") to prove wallet ownership.
 * 3. Recovers the public key from the signature and extracts a hex string.
 * 4. Collects Ethereum account metadata (network, address, balance, transaction count).
 * 5. Initializes a VeramoAgentWrapper with provider, signer, and public key. 
 * 6. Retrieves the DID and Veramo agent from the wrapper. 
 * 7. Stores DID, signature and public key in localStorage for session use. 
 * 8. Calls backend (checkDIDProfile) to retrieve profile metadata (creation, last access).
 * 9. Returns an object with the authenticated DID, signature, metadata, and agent instance. 
 * 
 * Params: 
 * - web3authProvider: the provider object from Web3Auth 
 * 
 * Returns: 
 * - An object with DID, signature, meta, and agent, or undefined if login fails. 
 */
export async function handleWeb3AuthLogin(web3authProvider) {
    if (!web3authProvider) return;

    try {

        // Setup ethers provider and signer
        const ethersProvider = new ethers.BrowserProvider(web3authProvider);
        const signer = await ethersProvider.getSigner();

        // Proof of wallet ownership via signed message
        const message = "DIDHub cryptographic key";
        const signature = await signer.signMessage(message);
        const digest = hashMessage(message);
        const publicKey = ethers.SigningKey.recoverPublicKey(digest, signature);
        // remove '0x04' prefix from uncompressed key
        const publicKeyHex = publicKey.slice(4);

        // Collect account + network metadata
        const network = await ethersProvider.getNetwork();
        const address = await signer.getAddress();
        const balance = await ethersProvider.getBalance(address);
        const transaction_count = await ethersProvider.getTransactionCount(address);
    
        // Initialize Veramo agent wrapper
        const agentWrapper = new VeramoAgentWrapper(ethersProvider, signer, publicKeyHex);
        await agentWrapper.init();

        const agent = agentWrapper.getAgent();
        const did = agentWrapper.getDID();

        // Persist DID/session info locally
        localStorage.setItem('did', did);
        localStorage.setItem('signature', signature);
        localStorage.setItem('publicKeyHex', publicKeyHex);

        // Check or create DID profile in backend
        const result = await checkDIDProfile({ agent, did });
        const meta_data = {
            balance: balance.toString(),
            transactions: Number(transaction_count), 
            network: network, 
            creation: result.creation, 
            access: result.access
        }

        const authenticatedDid = result.did;

        return { authenticatedDid, signature, meta_data, agent };
    } catch (err) {
        console.error("Error in handleCreateDIDProfile:", err);
    }
}