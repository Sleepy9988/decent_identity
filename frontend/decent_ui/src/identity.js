import { ethers, hashMessage } from "ethers";
import { recoverPublicKey } from "@ethersproject/signing-key";

import { checkDIDProfile } from "./components/helper"

export async function handleWeb3AuthLogin(web3authProvider) {
    if (!web3authProvider) return;

    try {
        const ethersProvider = new ethers.BrowserProvider(web3authProvider);
        const signer = await ethersProvider.getSigner();

        const message = "Public Key Extraction";
        const signature = await signer.signMessage(message);
        const digest = hashMessage(message);
        const publicKey = recoverPublicKey(digest, signature);
        const publicKeyHex = publicKey.slice(4);

        const network = await ethersProvider.getNetwork();
        const address = await signer.getAddress();
        console.log(network.name, network.chainId);

        const did = await checkDIDProfile({ signer, provider: ethersProvider, publicKeyHex, address});

        return did;
    
    } catch (err) {
        console.error("Error in handleCreateDIDProfile:", err);
    }
}