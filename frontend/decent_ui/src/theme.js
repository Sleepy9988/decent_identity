import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#1976d2'
        },
        background: {
            default: '#15222e',
        },
    },
    typography: {
        fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
        h1: { 
            fontSize: '3.2rem',
            fontWeight: 700,
        },
    },
});

export default theme;