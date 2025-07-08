import React, { useState } from 'react';
import './App.css';
import { useWeb3AuthConnect, useWeb3AuthDisconnect } from "@web3auth/modal/react";
//import { handleWeb3AuthLogin } from "./identity.js";

import Header from './components/Header/Header.jsx';
import LoginButton from "./components/Button/Button.jsx";

//import CreateIdentityButton from './components/Button/Button.jsx';

function App() {
  const { isConnected, loading: connectLoading } = useWeb3AuthConnect();
  const { disconnect } = useWeb3AuthDisconnect();

  const [did, setDid] = useState(null);
 
  return (
    <div className='App'>
      <Header />
        <main>
          <h1>Decentralized Identity & Profile Management</h1>
          {isConnected ? (
            <div>
              <p>Logged in as:</p>
              <p style={{ wordBreak: 'break-all' }}><strong>{did}</strong></p>
              {/*<button>Create DID Profile</button>*/}
              <button onClick={() => disconnect()}>Log Out</button>
          </div>
          ) : (
            <div>
              <LoginButton onDIDResolved={setDid} />
            </div>
          )}
          {connectLoading && <div>Connecting...</div>}
        </main>
    </div>
  );
}

export default App;
