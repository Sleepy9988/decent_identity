/*
  Reference:
  https://github.com/decentralized-identity/veramo/tree/next/packages/remote-server 
*/
import express from 'express';
import { agent } from './veramo_agent.js';
import swaggerUi from 'swagger-ui-express';
import {
  AgentRouter,
  ApiSchemaRouter,
  RequestWithAgentRouter,
} from '@veramo/remote-server';

// Methods exposed via Veramo Remote Server API.
// Could be dynamically fetched via agent.availableMethods() if desired.
const exposedMethods = [ 'verifyPresentationEIP712', 'verifyCredentialEIP712' ]//agent.availableMethods();

// Base API path for agent operations
const basePath = '/agent'
// Path for OpenAPI schema
const schemaPath = '/open-api.json'

// Create routers
const agentRouter = AgentRouter({ exposedMethods });
const schemaRouter = ApiSchemaRouter({ basePath, exposedMethods });

const app = express()

// Swagger UI config for OpenAPI docs
const swaggerUiOptions = {
  swaggerOptions: {
    url: 'http://localhost:3003/open-api.json',
  },
}

// Serve interactive API docs at /api-docs
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(undefined, swaggerUiOptions),
)

// Attach agent instance to requests, so routes have access to it
app.use(RequestWithAgentRouter({ agent }))

// Register Veramo routers
app.use(basePath, agentRouter)
app.use(schemaPath, schemaRouter)

// Parse JSON requests
app.use(express.json());


/**
 * POST /verify-presentation
 * 
 * Custom endpoint for verifying Verifiable Presentations (VPs).
 * - Expects: { presentation, challenge, domain } in request body.
 * - Uses Veramo verifyPresentationEIP712 to validate presentations.
 * - Respons with verification status, issuer DID, and original presentation. 
 */
app.post('/verify-presentation', express.json(), async (req, res) => {
  const { presentation, challenge, domain } = req.body

  console.log('Received presentation:', JSON.stringify(presentation, null, 2));
  console.log('Challenge:', challenge);
  console.log('Domain:', domain);

  if (!presentation || !challenge ) {
    return res.status(400).json({ error: 'Missing presentation or challenge'});
  }

  try {
    const result = await agent.verifyPresentationEIP712({
      presentation, 
      challenge,
      domain: 11155111
    });

    console.log('Verification result:', result);

    const responsePayload = {
      verified: result,
      issuer: presentation.holder,
      presentation: presentation,
    };

    
    console.log('Verification result:', JSON.stringify(responsePayload, null, 2))

    res.status(200).json(responsePayload);
  
  } catch (err) {
    console.error('Presentation verification failed:', err)
    res.status(500).json({ error: 'Verification failed' })
  }
})


/**
 * POST /verify-credential 
 * 
 * Custom endpoint for verifying Verifiable Credentials (VCs).
 * - Expects: { credential } in request body. 
 * - Uses Veramo verifyCredentialEIP712 to validate credentials. 
 * - Responds with verification status, issuer DID, and original credentials. 
 */
app.post('/verify-credential', express.json(), async (req, res) => {
  const { credential } = req.body;

  if(!credential) {
    return res.status(400).json({ error: 'Missing credential'});
  }

  try {
    const result = await agent.verifyCredentialEIP712({ credential });

    console.log('VC verfication result:', result);

    const responsePayload = {
      verified: result, 
      issuer: credential.issuer,
      credential,
    }

    res.status(200).json(responsePayload);
  } catch (err) {
    console.error('Credential verification failed:', err);
    res.status(500).json({ error: 'Credential could not be verified'});
  }
});

// Start server
const PORT = 3003
app.listen(PORT, () => console.log(`Listening on port ${PORT}`))
