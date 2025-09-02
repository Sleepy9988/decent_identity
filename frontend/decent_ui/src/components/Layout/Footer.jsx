import React from 'react';
import { Box, Typography, Link } from '@mui/material';

/**
 * Footer 
 * 
 * Simple footer component.
 * - Displays copyright with dynamic current year.
 * - Provides links to Veramo and Web3Auth sites 
 */

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        width: '100%',
        mt: 'auto',
        py: 2,
        px: 3,
        textAlign: 'center',
        backgroundColor: '#15222e',
        borderTop: '1px solid #e0e0e0',
      }}
    >
      <Typography variant="body1" color="text.secondary">
        &copy; {new Date().getFullYear()} DIDHub. All rights reserved.
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Built with{' '}
        <Link
          href="https://veramo.io/"
          target="_blank"
          rel="noopener noreferrer"
          color="primary"
          underline="hover"
        >
          Veramo
        </Link>{' '}
        &amp;{' '}
        <Link
          href="https://web3auth.io/"
          target="_blank"
          rel="noopener noreferrer"
          color="primary"
          underline="hover"
        >
          Web3Auth
        </Link>
        .
      </Typography>
    </Box>
  );
}
