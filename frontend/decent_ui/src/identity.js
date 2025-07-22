import { ethers, hashMessage } from "ethers";
import { recoverPublicKey } from "@ethersproject/signing-key";

import { checkDIDProfile } from "./components/helper"

import VeramoAgentWrapper from "./agent";

export async function handleWeb3AuthLogin(web3authProvider, setAgent, setDid, setAccessToken) {
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
        //const address = await signer.getAddress();
        console.log(network.name, network.chainId);

        const agentWrapper = new VeramoAgentWrapper(ethersProvider, signer, publicKeyHex);
        await agentWrapper.init();

        const agent = agentWrapper.getAgent();
        const did = agentWrapper.getDID();

        setAgent(agent);
        setDid(did);

        const result = await checkDIDProfile({ agent, did });
        const accessToken = result.accessToken;
        const authenticatedDid = result.did;

        if (!accessToken) {
            throw new Error('Access token missing from profile check');
        }

        setAccessToken(accessToken)

        return { authenticatedDid, accessToken };
    
    } catch (err) {
        console.error("Error in handleCreateDIDProfile:", err);
    }
}