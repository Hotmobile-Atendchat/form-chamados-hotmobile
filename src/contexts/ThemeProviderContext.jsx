import React, { createContext, useMemo, useState, useContext, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import useMediaQuery from '@mui/material/useMediaQuery';

const ColorModeContext = createContext({ toggleColorMode: () => {} });

export function useColorMode() {
  return useContext(ColorModeContext);
}

export default function ThemeProviderContext({ children }) {
  // 1. Detecta preferência do sistema
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  
  // 2. Estado inicial com persistência (localStorage)
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode ? savedMode : (prefersDarkMode ? 'dark' : 'light');
  });

  // 3. Função de toggle que salva no localStorage
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          localStorage.setItem('themeMode', newMode);
          return newMode;
        });
      },
    }),
    []
  );

  // 4. Definição do Tema
  const theme = useMemo(() => {
    const isDark = mode === 'dark';

    return createTheme({
      palette: {
        mode,
        primary: {
          // Ajuste fino: Azul mais vibrante no dark para contraste
          main: isDark ? '#90caf9' : '#1976d2',
        },
        background: {
          // Dark Mode Profissional (estilo GitHub/VSCode)
          default: isDark ? '#0F1214' : '#F4F6F8', 
          paper: isDark ? '#1A1D1F' : '#ffffff',
        },
        text: {
          // Padrão Material Design para legibilidade
          primary: isDark ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.87)',
          secondary: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
        },
        divider: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
      },
      typography: {
        fontFamily: "'Inter', 'Roboto', 'Arial', sans-serif", // Sugestão: Inter é muito moderna
      },
      components: {
        // Transição suave global
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              transition: 'background-color 0.3s ease, color 0.3s ease',
            },
          },
        },
        // Estilização automática de Cards e Papers
        MuiPaper: {
          styleOverrides: {
            root: {
              transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
              backgroundImage: 'none', // Remove overlay padrão do MUI no dark mode para ter controle total da cor
            },
          },
        },
        // Inputs mais bonitos no Dark Mode
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: isDark ? '#90caf9' : '#1976d2',
              },
            },
            notchedOutline: {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
            },
          },
        },
        // Padrao visual moderno para todos os modais
        MuiDialog: {
          styleOverrides: {
            paper: {
              borderRadius: 22,
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(25, 118, 210, 0.14)',
              boxShadow: isDark
                ? '0 24px 60px rgba(0,0,0,0.5)'
                : '0 24px 60px rgba(20, 44, 90, 0.22)',
              backgroundImage: 'none',
            },
          },
        },
        MuiDialogTitle: {
          styleOverrides: {
            root: {
              padding: '18px 22px',
              fontWeight: 800,
              letterSpacing: '0.01em',
            },
          },
        },
        MuiDialogContent: {
          styleOverrides: {
            root: {
              padding: '14px 22px 20px',
            },
          },
        },
        MuiDialogActions: {
          styleOverrides: {
            root: {
              padding: '12px 18px 18px',
              gap: 8,
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 10,
              textTransform: 'none',
              fontWeight: 700,
              letterSpacing: '0.01em',
              boxShadow: 'none',
            },
            contained: {
              boxShadow: isDark
                ? '0 10px 22px rgba(0, 0, 0, 0.35)'
                : '0 10px 22px rgba(25, 118, 210, 0.22)',
            },
          },
        },
        MuiIconButton: {
          styleOverrides: {
            root: {
              borderRadius: 12,
            },
          },
        },
      },
    });
  }, [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
