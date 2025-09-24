import React, { useMemo, useState, useEffect } from 'react';
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

function buildTheme(mode = 'light') {
  const base = {
    palette: {
      mode,
      primary: { main: '#8B5E3C', light: '#A97B59', dark: '#5E3C22', contrastText: '#fff8e6' },
      secondary: { main: '#C49A6C', light: '#D8B58E', dark: '#9E7A52' },
      error: { main: '#8B0000' },
      warning: { main: '#D2691E' },
      info: { main: '#B8860B' },
      success: { main: '#6B8E23' },
      grey: { 100: '#FFF8E6', 200: '#F3E3C3', 300: '#E6D0A8', 400: '#D4B88B', 500: '#C49A6C' },
      background: { default: '#FFF8E6', paper: '#FFFDF6' },
      divider: '#E6D0A8',
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontSize: '2.5rem', fontWeight: 600 },
      h2: { fontSize: '2rem', fontWeight: 600 },
      h3: { fontSize: '1.75rem', fontWeight: 500 },
      h4: { fontSize: '1.5rem', fontWeight: 500 },
      h5: { fontSize: '1.25rem', fontWeight: 500 },
      h6: { fontSize: '1rem', fontWeight: 500 },
    },
    components: {
      MuiButton: { styleOverrides: { root: { textTransform: 'none', borderRadius: 8, boxShadow: 'none' } } },
      MuiCard: { styleOverrides: { root: { borderRadius: 12, boxShadow: '0 2px 8px rgba(91,56,28,0.15)', background: 'linear-gradient(180deg, rgba(255,253,246,0.96) 0%, rgba(255,248,230,0.96) 100%)' } } },
      MuiPaper: { styleOverrides: { root: { borderRadius: 12, background: 'linear-gradient(180deg, rgba(255,253,246,0.98) 0%, rgba(255,248,230,0.98) 100%)' } } },
    },
  };

  if (mode === 'dark') {
    // Dark potato surfaces and accessible text
    base.palette.background = { default: '#1E1A15', paper: '#252017' };
    base.palette.text = { primary: '#F3E8D9', secondary: '#CDBEAA', disabled: '#9f8f7b' };
    base.palette.primary = { main: '#C49A6C', light: '#D8B58E', dark: '#9E7A52', contrastText: '#1b140e' };
    base.palette.secondary = { main: '#8B5E3C', light: '#A97B59', dark: '#5E3C22' };
    base.palette.divider = '#4A3929';

    // Component surfaces tuned for dark
    base.components.MuiCard.styleOverrides.root = {
      borderRadius: 12,
      boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
      background: 'linear-gradient(180deg, rgba(45,38,30,0.98) 0%, rgba(40,33,26,0.98) 100%)',
    };
    base.components.MuiPaper.styleOverrides.root = {
      borderRadius: 12,
      background: 'linear-gradient(180deg, rgba(45,38,30,0.98) 0%, rgba(40,33,26,0.98) 100%)',
    };
  }

  return createTheme(base);
}

function Root() {
  const [mode, setMode] = useState('light');

  // Load user preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('theme-preference');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.mode) setMode(p.mode);
      } catch (_) {}
    }
    // If system is requested at some point, initialize appropriately
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.mode === 'system') {
          const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
          setMode(prefersDark ? 'dark' : 'light');
        }
      } catch (_) {}
    }
  }, []);

  // Listen for theme-change events from anywhere in the app
  useEffect(() => {
    const handler = (e) => {
      const detail = e?.detail || {};
      let nextMode = detail.mode || mode;
      if (detail.mode === 'system') {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        nextMode = prefersDark ? 'dark' : 'light';
      }
      setMode(nextMode);
      try {
        localStorage.setItem('theme-preference', JSON.stringify({ mode: detail.mode || nextMode }));
      } catch (_) {}
    };
    window.addEventListener('theme-change', handler);
    return () => window.removeEventListener('theme-change', handler);
  }, [mode]);

  const theme = useMemo(() => buildTheme(mode), [mode]);

  return (
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
                  theme={mode === 'dark' ? 'dark' : 'light'}
                />
              </ThreatsProvider>
            </SocketProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);