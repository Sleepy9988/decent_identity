import React from "react";
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <p>
        &copy; {new Date().getFullYear()} DIDHub. All rights reserved.
      </p>
      <p>
        Built with{" "}
        <a
          href="https://veramo.io/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#007bff", textDecoration: "none" }}
        >
          Veramo
        </a>{" "}
        &amp;{" "}
        <a
          href="https://web3auth.io/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#007bff", textDecoration: "none" }}
        >
          Web3Auth
        </a>
        .
      </p>
    </footer>
  );
}
