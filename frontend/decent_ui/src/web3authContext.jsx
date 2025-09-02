import { WEB3AUTH_NETWORK } from "@web3auth/modal";

/**
 * Web3Auth configurations options. 
 * 
 * - clientId: Unique project ID from Web3Auth dashboard (must be kept secure).
 * - web3AuthNetwork: specifies which Web3Auth network to use.
 *     - Options: SAPPHIRE_MAINNET, SAPPHIRE_TESTNET, SAPPHIRE_DEVNET
 * 
 */

const web3AuthOptions = {
  clientId: "BJp80EZJJqcl7ACrqvESO0VJoR_Ec5bU1uecQAjwPOypm4Q600a5r3lQzGq0CG3APgttb2z1ATT_q1ur88DX500",
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
};

/**
 * Exported config object used by Web3AuthProvider
 * 
 * - Contains the Web3Auth initilization options. 
 * - chainConfig is managed via the Web3Auth dashboard and can be 
 *   extended here if settings need to be changed. 
 */

const web3AuthContextConfig = {
    web3AuthOptions,
    /* chainConfig: managed via the dashboard  */
};

export default web3AuthContextConfig;


