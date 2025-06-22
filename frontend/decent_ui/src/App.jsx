import React from 'react';
import './App.css';
import Header from './components/Header/Header.jsx';
import CreateIdentityButton from './components/Button/Button.jsx';

function App() {
  return (
    <div className='App'>
      <Header />
        <main>
          <h1>Decentralized Identity & Profile Management</h1>
          <CreateIdentityButton />  
        </main>
    </div>
  );
}

export default App;
