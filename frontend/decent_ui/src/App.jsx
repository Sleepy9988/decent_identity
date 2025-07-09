import React, { useState } from 'react';
import './App.css';
import { useWeb3AuthConnect } from "@web3auth/modal/react";

import Header from './components/Header/Header.jsx';
import Footer from './components/Footer/Footer.jsx';
import ConnectWeb3AuthButton from "./components/Button/ConnectWeb3AuthButton.jsx";
import DisconnectWeb3AuthButton from "./components/Button/DisconnectWeb3AuthButton.jsx"


function App() {
  const { isConnected, loading: connectLoading } = useWeb3AuthConnect();

  const [did, setDid] = useState(null);

  const loggedIn = isConnected && did;
 
  return (
    <div className='App'>
      <Header />
        <main>
          <h1>Decentralized Identity & Profile Management</h1>
          <div>
            <DisconnectWeb3AuthButton/>
          </div>
          {loggedIn ? (
            <div>
              <p>Logged in as:</p>
              <p style={{ wordBreak: 'break-all' }}><strong>{did}</strong></p>
              
            </div>
          ) : (
            <div>
              <ConnectWeb3AuthButton onDIDResolved={setDid} />
            </div>
          )}
          {connectLoading && <div>Connecting...</div>}
        </main>
        <Footer/>
    </div>
  );
}

export default App;
