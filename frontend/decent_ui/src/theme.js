import { createTheme, responsiveFontSizes } from "@mui/material/styles";

let theme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#1976d2'},
        background: {default: '#15222e'},
    },
    typography: {
        fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
        h1: { fontWeight: 700, fontSize: "3.2rem" },
        h2: { fontWeight: 600, fontSize: "2rem" },
        body1: { fontSize: "1rem", lineHeight: 1.6 },
    },
    components: {
        MuiContainer: { defaultProps: { maxWidth: "lg" } },
        MuiButton: { styleOverrides: { root: { textTransform: "none" } } },
  },
});
theme = responsiveFontSizes(theme);
export default theme;