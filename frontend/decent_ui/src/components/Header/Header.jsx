import React from 'react';
import './Header.css';

export default function Header() {

  return (
    <header className="app-header">
      <div className="logo-container">
        {/* Your Logo and App Name */}
        <a href="/">MyApp</a>
      </div>
      
      <nav className="navigation-links">
        {/* Your Navigation Links */}
        <a href="/">Home</a>
      </nav>
    </header>
  );
}