import React from 'react';
import './Header.css';

export default function Header() {

  return (
    <header className="app-header">
      <div className="logo-container">
        {/* Logo and App Name */}
        <a href="/">MyApp</a>
      </div>
      
      <nav className="navigation-links">
        {/* Navigation Links */}
        <a href="/">Home</a>
      </nav>
    </header>
  );
}