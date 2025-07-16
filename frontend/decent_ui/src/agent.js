// Import libraries and Veramo plugins
import { createAgent} from '@veramo/core';
import { KeyManager, MemoryKeyStore, MemoryPrivateKeyStore} from '@veramo/key-manager';
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager';
import { CredentialPlugin } from '@veramo/credential-w3c';
import { DIDResolverPlugin } from '@veramo/did-resolver';
import { EthrDIDProvider } from '@veramo/did-provider-ethr';
import { getResolver as ethrDidResolver } from 'ethr-did-resolver';
import { Web3KeyManagementSystem } from '@veramo/kms-web3';
import { CredentialIssuerEIP712 } from '@veramo/credential-eip712';
import { getResolver } from 'ethr-did-resolver';
import { Resolver } from 'did-resolver';
//import { KeyDIDProvider, getDidKeyResolver } from '@veramo/did-provider-key';
//import { KeyManagementSystem } from '@veramo/kms-local';

// Infura Project ID - to get information from the Ethereum Sepolia blockchain
const infuraProjectId = '6568670383cf484cb817256f0eea66b5'


class VeramoAgentWrapper {
    constructor(provider, signer, publicKeyHex) {
        this.provider = provider;
        this.signer = signer;
        this.publicKeyHex = publicKeyHex;
        this.agent = null;
        this.did = null;
    }

    async init() {
        const kms = new Web3KeyManagementSystem({web3: this.provider});

        const address = await this.signer.getAddress();
        const networkName = (await this.signer.provider.getNetwork()).name;
        const didProviderKey = `did:ethr:${networkName}`;
        const keyId = `web3-${address}`;
        this.did = `${didProviderKey}:${address}`;

        this.agent = createAgent({
            plugins: [
                // DID Resolver plugin to resolve DIDs 
                new DIDResolverPlugin({
                    ...ethrDidResolver({ 
                        networks: [
                            {
                            name: 'sepolia',
                            rpcUrl: 'https://sepolia.infura.io/v3/' + infuraProjectId  ,
                            registry: '0x03d5003bf0e79C5F5223588F347ebA39AfbC3818' // Sepolia registry
                            },
                        ],
                    }),
                }),
                // Key Manager Plugin to manage keys and offload signing to the Web3 wallet
                new KeyManager({
                    kms: {
                        web3: kms,
                    },
                    store: new MemoryKeyStore(),
                }),
                // DID Manager Plugin to create and import DIDs
                new DIDManager({
                    store: new MemoryDIDStore(),
                    defaultProvider: didProviderKey,
                    providers: {
                        [didProviderKey]: new EthrDIDProvider({
                            defaultKms: 'web3',
                            network: networkName,
                            rpcUrl: `https://${networkName}.infura.io/v3/` + infuraProjectId,
                            identifier: address,
                            signer: this.signer
                        }),
                    },
                }),
                // Verifiable Credential Plugin to create and verify VCs
                new CredentialPlugin(),
                // EIP-712 Credential Issuing Plugin to sign with Ethereum wallets
                new CredentialIssuerEIP712(), 
            ],
        })
        // Define DID
        const did = `${didProviderKey}:${address}`;
        
        // Import the public key from Web3 wallet
        await this.agent.keyManagerImport({
            kid: `web3-${address}`,
            type: 'Secp256k1',
            kms: 'web3',
            publicKeyHex: this.publicKeyHex,
            meta: {
                algorithms: ['eth_signMessage', 'eth_signTypedData', 'EthereumEip712Signature2021'],
            },
        });
        
        // Import DID to reference it with the key
        await this.agent.didManagerImport({
            did: did,
            provider: didProviderKey,
            controllerKeyId: keyId,
            keys: [{
                kid: `web3-${address}`,
                type: 'Secp256k1',
                kms: 'web3',
                publicKeyHex: this.publicKeyHex,
                meta: {
                    algorithms: ['eth_signMessage', 'eth_signTypedData', 'EthereumEip712Signature2021'],
                },
            }],
        });
        // Return the agent instance
        return this; 
    }
    
    getAgent() {
        return this.agent;
    }

    getDID() {
        return this.did;
    }
}

export default VeramoAgentWrapper;

/*
// Function to initialize and return Veramo agent
export const createVeramoAgent = async (signer, provider, publicKeyHex) => {
    // Create instance of the Web3 Key Management System using the Web3 browser provider
    const kms = new Web3KeyManagementSystem({web3: provider});
    // get the wallet address
    const address = await signer.getAddress();
    // get the Ethereum network name
    const networkName = (await signer.provider.getNetwork()).name;
    // Define DID provider key
    const didProviderKey = `did:ethr:${networkName}`;
    // reference to the wallet
    const keyId = `web3-${address}`;

    // Create Veramo agent with necessary plugins
    const agent = createAgent({
        plugins: [
            // DID Resolver plugin to resolve DIDs 
            new DIDResolverPlugin({
                ...ethrDidResolver({ 
                    networks: [
                        {
                           name: 'sepolia',
                           rpcUrl: 'https://sepolia.infura.io/v3/' + infuraProjectId  ,
                           registry: '0x03d5003bf0e79C5F5223588F347ebA39AfbC3818' // Sepolia registry
                        },
                    ],
                }),
            }),
            // Key Manager Plugin to manage keys and offload signing to the Web3 wallet
            new KeyManager({
                kms: {
                    web3: kms,
                },
                store: new MemoryKeyStore(),
            }),
            // DID Manager Plugin to create and import DIDs
            new DIDManager({
                store: new MemoryDIDStore(),
                defaultProvider: didProviderKey,
                providers: {
                    [didProviderKey]: new EthrDIDProvider({
                        defaultKms: 'web3',
                        network: networkName,
                        rpcUrl: `https://${networkName}.infura.io/v3/` + infuraProjectId,
                        identifier: address,
                        signer: signer
                    }),
                },
            }),
            // Verifiable Credential Plugin to create and verify VCs
            new CredentialPlugin(),
            // EIP-712 Credential Issuing Plugin to sign with Ethereum wallets
            new CredentialIssuerEIP712(), 
        ],
    })
    // Define DID
    const did = `${didProviderKey}:${address}`;
    
    // Import the public key from Web3 wallet
    await agent.keyManagerImport({
        kid: `web3-${address}`,
        type: 'Secp256k1',
        kms: 'web3',
        publicKeyHex,
        meta: {
            algorithms: ['eth_signMessage', 'eth_signTypedData', 'EthereumEip712Signature2021'],
        },
    });
    
    // Import DID to reference it with the key
    await agent.didManagerImport({
        did: did,
        provider: didProviderKey,
        controllerKeyId: keyId,
        keys: [{
            kid: `web3-${address}`,
            type: 'Secp256k1',
            kms: 'web3',
            publicKeyHex,
            meta: {
                algorithms: ['eth_signMessage', 'eth_signTypedData', 'EthereumEip712Signature2021'],
            },
        }],
        
    });
    // Return the agent instance
    return agent 
};
*/

export const createResolver = () => {
    const ethrDidResolver = getResolver({
           networks: [
               {
                   name: 'sepolia',
                   rpcUrl: 'https://sepolia.infura.io/v3/6568670383cf484cb817256f0eea66b5',
                   registry: '0x03d5003bf0e79C5F5223588F347ebA39AfbC3818'
               }
           ]
       });
       const resolver = new Resolver(ethrDidResolver);
    return resolver;
}

/*
export const createKeyDidAgent = async () => {
    const agent = createAgent({
        plugins: [
            new KeyManager({
                store: new MemoryKeyStore(),
                kms: {
                    local: new KeyManagementSystem(new MemoryPrivateKeyStore()),
                },
            }),
            new DIDManager({
                store: new MemoryDIDStore(),
                defaultProvider: 'did:key',
                providers: {
                    'did:key': new KeyDIDProvider({ defaultKms: 'local' }),
                },
            }),
            new DIDResolverPlugin({
                ...getDidKeyResolver(),
            }),
        ],
    });
    return agent;
}
*/

