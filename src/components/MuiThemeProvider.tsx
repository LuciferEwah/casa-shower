'use client';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { useMemo } from 'react';

export function MuiThemeProvider({ children }: { children: React.ReactNode }) {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? 'dark' : 'light',
          primary: { main: '#9333ea' }, // purple-600
          secondary: { main: '#c026d3' }, // fuchsia-600
          background: {
            default: 'transparent',
          },
        },
        typography: {
          fontFamily: '"Outfit", "Inter", sans-serif',
        },
        shape: {
          borderRadius: 16,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                borderRadius: '9999px',
                fontWeight: 600,
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: '16px',
                  // Remove hardcoded background color to let Tailwind handle it
                },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: '16px',
              },
            },
          },
        },
      }),
    [prefersDarkMode],
  );

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
