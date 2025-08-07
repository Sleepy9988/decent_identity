/*
  Inspired by the following repository:
  https://github.com/decentralized-identity/veramo/tree/next/packages/remote-server 
*/
import express from 'express';
import { agent } from './setup.js';
import swaggerUi from 'swagger-ui-express';
import {
  AgentRouter,
  ApiSchemaRouter,
  RequestWithAgentRouter,
} from '@veramo/remote-server';
import { resolveAddress } from 'ethers';

const exposedMethods = [ 'verifyPresentationEIP712', 'verifyCredentialEIP712' ]//agent.availableMethods();

const basePath = '/agent'
const schemaPath = '/open-api.json'

const agentRouter = AgentRouter({
  exposedMethods,
});

const schemaRouter = ApiSchemaRouter({
  basePath,
  exposedMethods,
})

const app = express()

const swaggerUiOptions = {
  swaggerOptions: {
    url: 'http://localhost:3003/open-api.json',
  },
}

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(undefined, swaggerUiOptions),
)

app.use(RequestWithAgentRouter({ agent }))
app.use(basePath, agentRouter)
app.use(schemaPath, schemaRouter)
app.use(express.json());

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

const PORT = 3003
app.listen(PORT, () => console.log(`Listening on port ${PORT}`))
