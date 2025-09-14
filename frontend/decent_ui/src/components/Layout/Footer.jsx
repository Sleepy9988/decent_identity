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
        py: { xs: 1.5, sm: 2 },
        px: { xs: 2, sm: 3 },
        textAlign: 'center',
        backgroundColor: '#15222e',
        borderTop: '1px solid #e0e0e0',
      }}
    >
      <Typography color="text.secondary" sx={{ typography: { xs: 'body2', sm: 'body1' } }}>
        &copy; {new Date().getFullYear()} DIDHub. All rights reserved.
      </Typography>
      <Typography color="text.secondary" sx={{ typography: { xs: 'body2', sm: 'body1' } }}>
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
