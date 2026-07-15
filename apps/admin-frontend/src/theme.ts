import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1178D7',
      light: '#3da0ff',
      dark: '#0a58a9',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#211C0E',
    },
    background: {
      default: '#F4F6F8',
      paper: '#ffffff',
    },
    text: {
      primary: '#111827',
      secondary: '#4B5563',
    },
    divider: 'rgba(17, 120, 215, 0.12)'
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: 'Inter, Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", Arial, sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 800 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 14,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(90deg, #0a58a9 0%, #1178D7 50%, #3da0ff 100%)',
        },
      },
    },
  },
});

export default theme;