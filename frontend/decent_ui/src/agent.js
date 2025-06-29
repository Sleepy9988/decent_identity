import { createAgent} from '@veramo/core';
import { KeyManager, MemoryKeyStore } from '@veramo/key-manager';
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager';
import { CredentialPlugin } from '@veramo/credential-w3c';
import { DIDResolverPlugin } from '@veramo/did-resolver';
import { EthrDIDProvider } from '@veramo/did-provider-ethr';
import { getResolver as ethrDidResolver } from 'ethr-did-resolver';
import { Web3KeyManagementSystem } from '@veramo/kms-web3';
import { CredentialIssuerEIP712 } from '@veramo/credential-eip712'

const infuraProjectId = '6568670383cf484cb817256f0eea66b5'

export const createVeramoAgent = async (signer, provider, publicKeyHex) => {
    const kms = new Web3KeyManagementSystem({web3: provider});
    const address = await signer.getAddress();
    const networkName = (await signer.provider.getNetwork()).name;
    
    const didProviderKey = `did:ethr:${networkName}`;

    const keyId = `web3-${address}`;

    const agent = createAgent({
        plugins: [
            new DIDResolverPlugin({
                ...ethrDidResolver({ 
                    networks: [
                        {
                           name: 'sepolia',
                           rpcUrl: 'https://sepolia.infura.io/v3/' + infuraProjectId  ,
                           registry: '0x03d5003bf0e79C5F5223588F347ebA39AfbC3818'
                        },
                    ],
                }),
            }),
            new KeyManager({
                kms: {
                    web3: kms,
                },
                store: new MemoryKeyStore(),
            }),
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
            new CredentialPlugin(),
            new CredentialIssuerEIP712(), 
        ],
    })

    const did = `${didProviderKey}:${address}`;
    
    await agent.keyManagerImport({
        kid: `web3-${address}`,
        type: 'Secp256k1',
        kms: 'web3',
        publicKeyHex,
        meta: {
            algorithms: ['eth_signMessage', 'eth_signTypedData', 'EthereumEip712Signature2021'],
        },
    });
    
    
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

    return agent 
};
