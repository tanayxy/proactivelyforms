import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#7c3aed', // Purple
      contrastText: '#fff',
    },
    secondary: {
      main: '#fff',
      contrastText: '#7c3aed',
    },
    background: {
      default: '#f6f6fa',
      paper: '#fff',
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: 'Inter, Roboto, Arial, sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: '0 2px 8px 0 rgba(124,58,237,0.10)',
          transition: 'box-shadow 0.2s, transform 0.2s',
          '&:hover': {
            boxShadow: '0 6px 24px 0 rgba(124,58,237,0.18)',
            transform: 'scale(1.04)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0 4px 24px 0 rgba(124,58,237,0.14)',
          transition: 'box-shadow 0.2s, transform 0.2s',
          '&:hover': {
            boxShadow: '0 8px 32px 0 rgba(124,58,237,0.22)',
            transform: 'translateY(-2px) scale(1.02)',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: 'rgba(255,255,255,0.85)',
          boxShadow: '0 8px 32px 0 rgba(124,58,237,0.18)',
          backdropFilter: 'blur(8px)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            transition: 'box-shadow 0.2s',
            '&.Mui-focused fieldset': {
              boxShadow: '0 0 0 2px #a78bfa',
            },
          },
        },
      },
    },
  },
});

export default theme; 