import { createAgent } from '@veramo/core';
import { CredentialPlugin } from '@veramo/credential-w3c';
import { CredentialIssuerEIP712 } from '@veramo/credential-eip712';
import { DIDResolverPlugin } from '@veramo/did-resolver';
import { getResolver as ethrDidResolver } from 'ethr-did-resolver';

const infuraProjectId = process.env.INFURA_PROJECT_ID || '';
const registry = process.env.ETHR_REGISTRY_ADDRESS || '0x03d5003bf0e79C5F5223588F347ebA39AfbC3818';
const network = process.env.ETH_NETWORK || 'sepolia';

/**
 * Veramo Agent Configuration
 *
 * This agent is configured with:
 * - DIDResolverPlugin: Enables resolving Ethereum-based DIDs (`did:ethr`)
 *   using Infura RPC endpoints. Supports multiple networks.
 *   - mainnet (chainId 1)
 *   - sepolia testnet (chainId 11155111, with explicit registry contract)
 *
 * - CredentialIssuerEIP712: Adds support for issuing/verifying
 *   W3C Verifiable Credentials (VCs) using EIP-712 typed data signatures.
 *
 * - CredentialPlugin: Provides standard Verifiable Credential
 *   issuance/verification APIs (W3C-compliant).
 */

export const agent = createAgent({
  plugins: [
    // DID resolver for `did:ethr` method, configured for multiple networks
    new DIDResolverPlugin({
      ...ethrDidResolver({ 
        infuraProjectId,
        networks: [
          { 
            name: 'mainnet', 
            rpcUrl: `https://mainnet.infura.io/v3/${infuraProjectId}`, 
            chainId: 1
          },
          { 
            name: 'sepolia', 
            rpcUrl: `https://${network}.infura.io/v3/${infuraProjectId}`, 
            chainId: 11155111, 
            registry
          },
        ], 
       }),
    }),
    // Enables issuing/verifying credentials with EIP-712 signatures
    new CredentialIssuerEIP712(),

    // Core W3C credential issuance/verification plugin
    new CredentialPlugin({
      issuers: [],
    })
  ]
})


