import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import App from './App';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThreatsProvider } from './context/ThreatsContext';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Create theme (Potato palette)
const theme = createTheme({
  palette: {
    mode: 'light',
    // Russet potato browns and golds
    primary: {
      main: '#8B5E3C', // russet skin
      light: '#A97B59',
      dark: '#5E3C22',
      contrastText: '#fff8e6',
    },
    secondary: {
      main: '#C49A6C', // roasted gold
      light: '#D8B58E',
      dark: '#9E7A52',
    },
    error: {
      main: '#8B0000', // rotten red-brown
    },
    warning: {
      main: '#D2691E', // baked sweet potato
    },
    info: {
      main: '#B8860B', // golden glaze
    },
    success: {
      main: '#6B8E23', // fresh leaf/eye
    },
    grey: {
      100: '#FFF8E6', // mashed backdrop
      200: '#F3E3C3',
      300: '#E6D0A8',
      400: '#D4B88B',
      500: '#C49A6C',
    },
    background: {
      default: '#FFF8E6', // buttery mash
      paper: '#FFFDF6',
    },
    divider: '#E6D0A8',
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          boxShadow: 'none',
        },
        containedPrimary: {
          backgroundColor: '#8B5E3C',
          '&:hover': { backgroundColor: '#724c31' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(91, 56, 28, 0.15)',
          background: 'linear-gradient(180deg, rgba(255,253,246,0.96) 0%, rgba(255,248,230,0.96) 100%)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          background: 'linear-gradient(180deg, rgba(255,253,246,0.98) 0%, rgba(255,248,230,0.98) 100%)',
        },
      },
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SocketProvider>
              <ThreatsProvider>
                <App />
                <ToastContainer
                  position="top-right"
                  autoClose={5000}
                  hideProgressBar={false}
                  newestOnTop={false}
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                  theme="light"
                />
              </ThreatsProvider>
            </SocketProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);