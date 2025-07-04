import React from 'react';
import './Header.css';
import logo from '../../assets/logo.png';

export default function Header() {

  return (
    <header className="app-header">
      <div className="logo-container">
        {/* Logo and App Name */}
        <a href="/" className="logo-link">
        <img src={logo} alt="DIDHub Logo" className="logo-image"/>
        <span className="app-name">DIDHub</span>
        </a>
      </div>
      
      <nav className="navigation-links">
        {/* Navigation Links */}
        <a href="/">Home</a>
      </nav>
    </header>
  );
}