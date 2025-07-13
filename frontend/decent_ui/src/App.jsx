import React, { useState } from 'react';
import './App.css';
import { useWeb3AuthConnect } from "@web3auth/modal/react";

import Header from './components/Header/Header.jsx';
import Footer from './components/Footer/Footer.jsx';
import ConnectWeb3AuthButton from "./components/Button/ConnectWeb3AuthButton.jsx";
import DisconnectWeb3AuthButton from "./components/Button/DisconnectWeb3AuthButton.jsx"

import { checkDidOnChain } from './components/helper.js';


function App() {
  const { isConnected, loading: connectLoading } = useWeb3AuthConnect();

  const [did, setDid] = useState(null);

  //const loggedIn = isConnected && did;
 
  return (
    <div className='App'>
      <Header />
      <div className="container">
        <main>
          <h1>Decentralized Identity & Profile Management</h1>
          {!isConnected ? (
            <ConnectWeb3AuthButton onDIDResolved={setDid} />
          ) : (
            <div>
              <p>Logged in as:</p>
              <p>
                <strong>{did}</strong>
              </p>
              <DisconnectWeb3AuthButton/>
              <button onClick={() => checkDidOnChain(did)}>Check did on Chain</button>
            </div>
          )}
          {connectLoading && <div>Connecting...</div>}
        </main>
        </div>
      <Footer/>
    </div>
  );
}

export default App;
