import { createAgent } from '@veramo/core';
import { CredentialPlugin } from '@veramo/credential-w3c';
import { CredentialIssuerEIP712 } from '@veramo/credential-eip712';
import { DIDResolverPlugin } from '@veramo/did-resolver';
import { getResolver as ethrDidResolver } from 'ethr-did-resolver';

import { getDidKeyResolver } from '@veramo/did-provider-key';

const infuraProjectId = '6568670383cf484cb817256f0eea66b5'

export const agent = createAgent({
  plugins: [
    new DIDResolverPlugin({
      ...ethrDidResolver({ 
        infuraProjectId,
        networks: [
          { 
            name: 'mainnet', 
            rpcUrl: 'https://mainnet.infura.io/v3/' + infuraProjectId, 
            chainId: 1
          },
          { 
            name: 'sepolia', 
            rpcUrl: 'https://sepolia.infura.io/v3/' + infuraProjectId, 
            chainId: 11155111, 
            registry: '0x03d5003bf0e79C5F5223588F347ebA39AfbC3818'
          },
        ], 
       }),
      //...getDidKeyResolver(),
    }),
    new CredentialIssuerEIP712(),
    new CredentialPlugin({
      issuers: [],
    })
  ]
})


